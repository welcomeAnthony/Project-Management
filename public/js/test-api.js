// Minimal API test
console.log('Minimal API script loaded');

class SimpleApiClient {
    constructor() {
        console.log('SimpleApiClient created');
    }
    
    async getStocks() {
        console.log('getStocks called');
        try {
            const response = await fetch('/api/stocks?limit=10');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getStocks:', error);
            throw error;
        }
    }
}

window.testApi = new SimpleApiClient();
console.log('testApi created:', window.testApi);
