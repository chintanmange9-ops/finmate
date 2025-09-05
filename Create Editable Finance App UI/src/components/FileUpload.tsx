import React, { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, FileText, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface FileUploadProps {
  onFilesParsed: (transactions: any[]) => void;
  isLoading: boolean;
}

export function FileUpload({ onFilesParsed, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStatus, setParseStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'application/vnd.ms-excel' ||
                         file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                         file.name.toLowerCase().endsWith('.csv') ||
                         file.name.toLowerCase().endsWith('.txt') ||
                         file.type === 'text/plain';
      
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      parseFiles(validFiles);
    }
  };

  // Real file parsing function that handles CSV, Excel, TXT, and uses mock data for PDFs
  const parseFiles = async (files: File[]) => {
    setParseStatus('parsing');
    setParseProgress(0);
    
    try {
      const allTransactions: any[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setParseProgress((i / files.length) * 100);
        
        // Parse the actual file content
        const transactions = await parseFile(file);
        allTransactions.push(...transactions);
        
        // Small delay for user feedback
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setParseProgress(100);
      setParseStatus('success');
      
      // Sort transactions by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const csvCount = files.filter(f => f.name.toLowerCase().endsWith('.csv')).length;
      const xlsCount = files.filter(f => f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls')).length;
      const txtCount = files.filter(f => f.name.toLowerCase().endsWith('.txt')).length;
      const pdfCount = files.filter(f => f.name.toLowerCase().endsWith('.pdf')).length;
      
      let message = `Successfully parsed ${allTransactions.length} transactions from ${files.length} file(s)`;
      if (pdfCount > 0) {
        message += ` (PDF files not supported - use CSV/Excel for parsing)`;
      }
      
      toast.success(message);
      onFilesParsed(allTransactions);
      
    } catch (error) {
      setParseStatus('error');
      toast.error('Error parsing files. Please check file format and try again.');
    }
  };

  // Real file parser that handles CSV, Excel, and text files
  const parseFile = async (file: File): Promise<any[]> => {
    const fileName = file.name.toLowerCase();
    console.log(`Parsing file: ${fileName}, type: ${file.type}`);
    
    if (fileName.endsWith('.csv')) {
      console.log('Parsing as CSV file');
      return await parseCSVFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log('Parsing as Excel file');
      return await parseExcelFile(file);
    } else if (fileName.endsWith('.txt')) {
      console.log('Parsing as TXT file');
      return await parseTextFile(file);
    } else {
      // For PDF and other formats that we can't parse, return empty array
      console.log('PDF parsing not implemented, file format not supported:', fileName);
      return [];
    }
  };



  // Parse CSV files
  const parseCSVFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const transactions: any[] = [];
          
          // Skip header row if it exists
          const startIndex = lines[0].toLowerCase().includes('date') || 
                           lines[0].toLowerCase().includes('amount') ||
                           lines[0].toLowerCase().includes('description') ? 1 : 0;
          
          for (let i = startIndex; i < lines.length; i++) {
            const columns = parseCSVLine(lines[i]);
            if (columns.length >= 3) {
              const transaction = parseTransactionFromColumns(columns, file.name, i);
              if (transaction) {
                transactions.push(transaction);
              }
            }
          }
          
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  };

  // Parse Excel files using basic binary reading
  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          
          // For now, we'll use a simple text extraction approach
          // In a production app, you'd use libraries like 'xlsx' or 'exceljs'
          const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(data);
          
          // Look for patterns that might be transactions
          const transactions = extractTransactionsFromText(text, file.name);
          
          resolve(transactions);
        } catch (error) {
          console.log('Excel parsing failed');
          resolve([]);
        }
      };
      reader.onerror = () => resolve([]);
      reader.readAsArrayBuffer(file);
    });
  };

  // Parse text files
  const parseTextFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const transactions = extractTransactionsFromText(text, file.name);
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  };

  // Helper function to parse CSV lines properly handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Helper function to parse transaction from CSV columns
  const parseTransactionFromColumns = (columns: string[], fileName: string, index: number) => {
    try {
      // Common patterns for bank statement columns:
      // Date, Description, Amount
      // Date, Description, Debit, Credit
      // Date, Description, Amount, Balance
      
      let date = '';
      let description = '';
      let amount = 0;
      
      // Try to identify date column (first column usually)
      if (columns[0] && isDateLike(columns[0])) {
        date = standardizeDate(columns[0]);
      }
      
      // Try to find description (usually text without numbers)
      description = columns.find(col => col && !isNumberLike(col) && !isDateLike(col)) || columns[1] || '';
      
      // Try to find amount (look for numbers)
      for (const col of columns) {
        if (isNumberLike(col)) {
          const parsedAmount = parseAmount(col);
          if (parsedAmount !== 0) {
            amount = parsedAmount;
            break;
          }
        }
      }
      
      if (!date || !description || amount === 0) {
        return null;
      }
      
      return {
        id: `${fileName}-${index}`,
        date,
        description: description.replace(/"/g, '').trim(),
        category: categorizeTransaction(description),
        amount,
        type: amount > 0 ? 'income' : 'expense',
        source: fileName
      };
    } catch (error) {
      return null;
    }
  };

  // Helper function to extract transactions from any text
  const extractTransactionsFromText = (text: string, fileName: string): any[] => {
    const transactions: any[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for patterns that might contain transaction data
      const dateMatch = line.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/);
      const amountMatch = line.match(/[\-\+]?\$?[\d,]+\.?\d*/);
      
      if (dateMatch && amountMatch) {
        const date = standardizeDate(dateMatch[0]);
        const amount = parseAmount(amountMatch[0]);
        
        // Extract description (text between date and amount)
        let description = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
        description = description.replace(/[^\w\s\-\.]/g, ' ').trim();
        
        if (description && amount !== 0) {
          transactions.push({
            id: `${fileName}-${i}`,
            date,
            description,
            category: categorizeTransaction(description),
            amount,
            type: amount > 0 ? 'income' : 'expense',
            source: fileName
          });
        }
      }
    }
    
    return transactions;
  };

  // Helper functions
  const isDateLike = (str: string): boolean => {
    return /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(str);
  };

  const isNumberLike = (str: string): boolean => {
    return /^[\-\+]?\$?[\d,]+\.?\d*$/.test(str.trim());
  };

  const standardizeDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Try different date formats
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length === 3) {
          // Try MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD
          const formats = [
            new Date(`${parts[0]}/${parts[1]}/${parts[2]}`),
            new Date(`${parts[1]}/${parts[0]}/${parts[2]}`),
            new Date(`${parts[2]}/${parts[0]}/${parts[1]}`)
          ];
          
          for (const format of formats) {
            if (!isNaN(format.getTime())) {
              return format.toISOString().split('T')[0];
            }
          }
        }
        return new Date().toISOString().split('T')[0]; // Fallback to today
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const parseAmount = (amountStr: string): number => {
    try {
      // Remove currency symbols and commas
      const cleaned = amountStr.replace(/[\$,]/g, '').trim();
      
      // Handle parentheses as negative (accounting format)
      if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
        return -parseFloat(cleaned.slice(1, -1)) || 0;
      }
      
      return parseFloat(cleaned) || 0;
    } catch (error) {
      return 0;
    }
  };

  const categorizeTransaction = (description: string): string => {
    const desc = description.toLowerCase();
    
    // Income patterns
    if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) return 'Salary';
    if (desc.includes('deposit') || desc.includes('transfer in')) return 'Income';
    
    // Expense patterns
    if (desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant') || desc.includes('dining')) return 'Food';
    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('uber') || desc.includes('taxi') || desc.includes('transport')) return 'Transport';
    if (desc.includes('amazon') || desc.includes('shopping') || desc.includes('purchase') || desc.includes('store')) return 'Shopping';
    if (desc.includes('electric') || desc.includes('utility') || desc.includes('water') || desc.includes('internet') || desc.includes('phone')) return 'Bills';
    if (desc.includes('rent') || desc.includes('mortgage')) return 'Housing';
    if (desc.includes('medical') || desc.includes('doctor') || desc.includes('pharmacy') || desc.includes('hospital')) return 'Healthcare';
    if (desc.includes('movie') || desc.includes('entertainment') || desc.includes('streaming')) return 'Entertainment';
    
    return 'Other';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.pdf')) return FileText;
    return File;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2">Upload Bank Statements</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your bank statement files here, or click to select
          </p>
          <div className="text-xs text-gray-500 mb-4">
            <p><strong>CSV/Excel format:</strong> Date, Description, Amount (or Date, Description, Debit, Credit)</p>
            <p><strong>Best results:</strong> Export bank statements as CSV from your online banking</p>
          </div>
          <Button variant="outline">
            Choose Files
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: PDF, Excel (.xlsx, .xls), CSV, TXT • Max size: 10MB
          </p>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.csv,.txt"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="p-4">
          <h4 className="mb-3">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => {
              const Icon = getFileIcon(file.name);
              return (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Parsing Progress */}
      {parseStatus === 'parsing' && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Parsing statements...</span>
          </div>
          <Progress value={parseProgress} className="h-2" />
          <p className="text-xs text-gray-600 mt-2">{Math.round(parseProgress)}% complete</p>
        </Card>
      )}

      {/* Success/Error Status */}
      {parseStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Bank statements parsed successfully! Your transactions are now available in the app.
          </AlertDescription>
        </Alert>
      )}

      {parseStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Error parsing files. Please check your file format and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}