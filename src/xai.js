require('dotenv').config();
const OpenAI = require('openai');

class XAIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.XAI_API_KEY,
            baseURL: "https://api.x.ai/v1"
        });
    }

    async generateResponse(prompt, context = '') {
        try {
            const completion = await this.client.chat.completions.create({
                model: "grok-3-beta",
                messages: [
                    { 
                        role: "system", 
                        content: context || 'You are a claims/operations specialist at a Third-Party Administration company for med & rx claims called Wellnet Healthcare Administrators, Inc. that specializes in answering RFP (Request for Proposal) related questions. Provide clear, professional, and accurate responses.' 
                    },
                    { role: "user", content: prompt }
                ]
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('XAI API Error:', error.message);
            throw error;
        }
    }
}

module.exports = new XAIService();
