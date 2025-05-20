import pandas as pd
from pathlib import Path
import requests
import json
import sys
import time
from datetime import datetime
import logging
from difflib import SequenceMatcher

# Set up logging with console handler
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('qa_processor.log')
    ]
)
logger = logging.getLogger(__name__)

def print_and_log(message, level=logging.INFO):
    print(message)  # Immediate console output
    logger.log(level, message)

class APIError(Exception):
    pass

def check_server():
    try:
        logger.debug("Checking server health...")
        response = requests.get('http://localhost:3000/health')
        response.raise_for_status()
        logger.debug("Server health check passed")
        return True
    except Exception as e:
        logger.error(f"Server health check failed: {str(e)}")
        return False

def similar(a, b):
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, a, b).ratio()

def format_answer(answer):
    """Format the answer in a clear, professional manner"""
    # Remove any extra whitespace and normalize line endings
    answer = ' '.join(answer.split())
    
    # Add bullet points for lists if detected
    if ',' in answer and len(answer.split(',')) > 2:
        items = [item.strip() for item in answer.split(',')]
        answer = '\n'.join([f"• {item}" for item in items])
    
    return answer

def check_database(question):
    """Check for existing answer in database"""
    try:
        with open('qna_database.json', 'r', encoding='utf-8') as f:
            database = json.load(f)
            
        # Normalize question for comparison
        normalized_question = question.lower().strip()
        
        # Check for exact match
        if normalized_question in database:
            logger.info("Found exact match in database")
            return database[normalized_question]
            
        # Check for similar questions (80% similarity threshold)
        for q, a in database.items():
            if similar(normalized_question, q.lower()) > 0.8:
                logger.info("Found similar question in database")
                return a
                
        return None
        
    except FileNotFoundError:
        logger.warning("Database file not found")
        return None

def save_to_database(question, answer):
    """Save new Q&A pair to database"""
    try:
        # Load existing database
        try:
            with open('qna_database.json', 'r', encoding='utf-8') as f:
                database = json.load(f)
        except FileNotFoundError:
            database = {}
            
        # Add new entry
        database[question.lower().strip()] = answer
        
        # Save updated database
        with open('qna_database.json', 'w', encoding='utf-8') as f:
            json.dump(database, f, indent=2)
            logger.info("Saved new Q&A pair to database")
            
    except Exception as e:
        logger.error(f"Failed to save to database: {str(e)}")

def generate_answer(question, retry_count=3):
    """Generate answer for a question, checking database first"""
    # First check database
    db_answer = check_database(question)
    if db_answer:
        logger.info("Using answer from database")
        return format_answer(db_answer)
    
    # If no database match, use AI service
    logger.info("No match found in database, querying AI service")
    for attempt in range(retry_count):
        try:
            logger.debug(f"Generating answer for question: {question[:50]}...")
            response = requests.post(
                'http://localhost:3000/api/answer',
                json={
                    'question': question,
                    'instructions': """
                        Please provide a clear, professional, and succinct answer.
                        Focus on factual information.
                        Use bullet points for lists.
                        Limit response to essential information.
                        Maintain professional tone.
                    """
                },
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            response.raise_for_status()
            answer = response.json()['answer']
            
            # Format and save the answer
            formatted_answer = format_answer(answer)
            save_to_database(question, formatted_answer)
            
            logger.debug("Answer generated and saved to database")
            return formatted_answer
            
        except requests.RequestException as e:
            logger.error(f"API request failed (attempt {attempt + 1}): {str(e)}")
            if attempt == retry_count - 1:
                raise APIError(f"Failed to get answer after {retry_count} attempts: {str(e)}")
            logger.info(f"Retrying in {2 ** attempt} seconds...")
            time.sleep(2 ** attempt)  # Exponential backoff

def validate_csv(file_path):
    """Validate the CSV file format and content."""
    try:
        if not Path(file_path).exists():
            raise ValueError(f"File not found: {file_path}")
            
        if not file_path.lower().endswith('.csv'):
            raise ValueError("File must be a CSV file")
            
        # Try reading the file
        df = pd.read_csv(file_path)
        
        # Check for required columns
        if 'Question' not in df.columns:
            raise ValueError("CSV must contain 'Question' column")
            
        # Check for empty questions
        empty_questions = df['Question'].isna().sum()
        if empty_questions > 0:
            raise ValueError(f"Found {empty_questions} empty questions in the CSV")
            
        # Check for duplicate questions
        duplicates = df['Question'].duplicated().sum()
        if duplicates > 0:
            raise ValueError(f"Found {duplicates} duplicate questions in the CSV")
            
        return True, df
        
    except pd.errors.EmptyDataError:
        return False, "The CSV file is empty"
    except pd.errors.ParserError:
        return False, "Invalid CSV format"
    except Exception as e:
        return False, str(e)

def process_qa_file(file_path, batch_size=None, start_index=None, end_index=None):
    """Process the CSV file with questions and generate answers
    
    Args:
        file_path (str): Path to the CSV file
        batch_size (int, optional): Number of questions to process in this run
        start_index (int, optional): Start processing from this index
        end_index (int, optional): Stop processing at this index
    """
    try:
        if not check_server():
            raise APIError("Cannot connect to the API server. Please ensure it's running.")

        # Validate CSV file
        valid, result = validate_csv(file_path)
        if not valid:
            raise ValueError(f"Invalid CSV file: {result}")
        
        df = result
        
        # Handle batch processing parameters
        total_questions = len(df)
        start_index = start_index or 0
        end_index = min(end_index or total_questions, total_questions)
        
        if batch_size:
            end_index = min(start_index + batch_size, end_index)
            
        df_to_process = df.iloc[start_index:end_index]
        
        # Create 'Status' column if it doesn't exist
        if 'Status' not in df.columns:
            df['Status'] = 'pending'
            
        # Create 'Answer' column if it doesn't exist
        if 'Answer' not in df.columns:
            df['Answer'] = ''

        # Process each question and generate answer
        total_questions = len(df)
        start_time = time.time()
        
        for index, row in df.iterrows():
            if row['Status'] == 'completed':
                logger.info(f"Skipping question {index + 1} (already processed)")
                continue
                
            question = row['Question']
            progress = (index + 1) / total_questions * 100
            elapsed_time = time.time() - start_time
            avg_time_per_question = elapsed_time / (index + 1) if index > 0 else 0
            eta = avg_time_per_question * (total_questions - (index + 1))
            
            logger.info(f"\nProgress: {progress:.1f}% | Question {index + 1}/{total_questions}")
            logger.info(f"Question: {question[:100]}...")
            logger.info(f"Estimated time remaining: {eta/60:.1f} minutes")
            
            try:
                answer = generate_answer(question)
                df.at[index, 'Answer'] = answer
                df.at[index, 'Status'] = 'completed'
                
                # Save progress after each successful answer
                output_path = f"{Path(file_path).stem}_processed.csv"
                df.to_csv(output_path, index=False)
                
                # Rate limiting
                time.sleep(1)  # Prevent overwhelming the API
                
            except APIError as e:
                logger.error(f"Error processing question: {str(e)}")
                df.at[index, 'Status'] = 'error'
                continue
            
        # Final save
        output_path = f"{Path(file_path).stem}_processed.csv"
        df.to_csv(output_path, index=False)
        
        # Print summary
        total_time = time.time() - start_time
        completed = len(df[df['Status'] == 'completed'])
        errors = len(df[df['Status'] == 'error'])
        
        logger.info(f"\nProcessing complete!")
        logger.info(f"Total time: {total_time/60:.1f} minutes")
        logger.info(f"Questions processed: {completed}/{total_questions}")
        if errors > 0:
            logger.info(f"Errors encountered: {errors}")
        logger.info(f"Results saved to {output_path}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Process CSV file containing questions and generate answers using AI.')
    parser.add_argument('file_path', help='Path to the CSV file containing questions')
    parser.add_argument('--batch-size', type=int, help='Number of questions to process in this run')
    parser.add_argument('--start-index', type=int, help='Start processing from this index')
    parser.add_argument('--end-index', type=int, help='Stop processing at this index')
    parser.add_argument('--validate-only', action='store_true', help='Only validate the CSV file without processing')
    
    args = parser.parse_args()
    
    if args.validate_only:
        valid, result = validate_csv(args.file_path)
        if valid:
            logger.info(f"CSV file is valid! Found {len(result)} questions.")
            sys.exit(0)
        else:
            logger.error(f"CSV validation failed: {result}")
            sys.exit(1)
    
    logger.info(f"Processing file: {args.file_path}")
    if process_qa_file(args.file_path, args.batch_size, args.start_index, args.end_index):
        logger.info("File processing completed successfully!")
    else:
        logger.error("File processing failed.")
        sys.exit(1)