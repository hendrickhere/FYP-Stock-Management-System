// class SmartProductMatcher{
//     constructor(options = {}) {
//         this.options = {
//             minConfidence: 0.7, 
//             fuzzyOptions: {
//                 threshold: 0.3, 
//                 keys: ['name'], 
//                 includeScore: true
//             }
//         }
//     }
//     cleanText(text) {
//         return text.toLowerCase()
//                   .replace(/\s+/g, ' ')
//                   .replace(/[^\w\s-]/g, ' ')
//                   .replace(/\b(pcs|pieces|piece|pkg|pack|packet)\b/g, '')
//                   .trim();
//     }
//     generateVariations(text) {
//         const cleaned = this.cleanText(text);
//         const words = cleaned.split(' ').filter(w => w.length > 1);
        
//         return [
//             cleaned,
//             words.sort().join(' '),
//             words.reverse().join(' ')
//         ];
//     }
    
//     async findExactMatches(inputName, transaction = null) {
//         const variation = this.generateVariations(inputName);

//         const exactMatch = await Product
//     }
// }