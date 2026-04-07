/**
 * Generate invoice number in format: organizationcode/taxyear/month/10randomdigits
 * Example: DTPL/2025/10/1234567890
 */
export function generateInvoiceNumber(organizationCode, invoiceDate = new Date()) {
  const year = invoiceDate.getFullYear();
  const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
  
  // Generate 10 random digits
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  
  // Use organization code or default
  const orgCode = organizationCode || 'ORG';
  
  return `${orgCode}/${year}/${month}/${randomDigits}`;
}

/**
 * Convert number to words (for amount in words)
 */
export function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (num === 0) return 'Zero';
  
  function convertHundreds(n) {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  }
  
  let words = '';
  const numStr = num.toFixed(2);
  const parts = numStr.split('.');
  let integerPart = parseInt(parts[0]);
  const decimalPart = parseInt(parts[1]);
  
  if (integerPart >= 10000000) {
    words += convertHundreds(Math.floor(integerPart / 10000000)) + 'Crore ';
    integerPart %= 10000000;
  }
  if (integerPart >= 100000) {
    words += convertHundreds(Math.floor(integerPart / 100000)) + 'Lakh ';
    integerPart %= 100000;
  }
  if (integerPart >= 1000) {
    words += convertHundreds(Math.floor(integerPart / 1000)) + 'Thousand ';
    integerPart %= 1000;
  }
  if (integerPart > 0) {
    words += convertHundreds(integerPart);
  }
  
  words = words.trim();
  if (decimalPart > 0) {
    words += ' and ' + convertHundreds(decimalPart) + 'Paise';
  }
  
  return words.trim() + ' Only';
}

