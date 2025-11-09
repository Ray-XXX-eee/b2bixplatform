import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import './FileUpload.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const FileUpload = ({ onFileProcessed, acceptedTypes = ['.docx', '.pptx', '.pdf'], maxSize = 10485760 }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    setError('');
    if (!file) {
      setError('No file selected.');
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      setError(`Please upload a file with one of these extensions: ${acceptedTypes.join(', ')}`);
      return false;
    }

    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }

    return true;
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setError('');

    try {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (fileExtension === '.docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        if (text.trim()) {
          onFileProcessed(text);
        } else {
          setError('No text content found in the document');
        }
      } else if (fileExtension === '.pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();

          const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            useSystemFonts: true,
            disableFontFace: false,
          }).promise;

          let extractedText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(' ');
            extractedText += pageText + '\n';
          }

          if (extractedText.trim()) {
            onFileProcessed(extractedText);
          } else {
            setError('No text content found in the PDF');
          }
        } catch (pdfError) {
          if (pdfError.name === 'InvalidPDFException') {
            setError('Invalid PDF file. Please check if the file is corrupted.');
          } else if (pdfError.name === 'MissingPDFException') {
            setError('PDF file is missing or empty.');
          } else {
            setError(`Failed to process PDF file: ${pdfError.message}`);
          }
        }
      } else if (fileExtension === '.pptx') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);

          let extractedText = '';
          const slideFiles = Object.keys(zip.files).filter((name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));

          for (const slideFile of slideFiles) {
            const slideContent = await zip.files[slideFile].async('text');
            const textMatches = slideContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
            if (textMatches) {
              textMatches.forEach((match) => {
                const textContent = match.replace(/<[^>]*>/g, '');
                if (textContent.trim()) {
                  extractedText += textContent + '\n';
                }
              });
            }

            const titleMatches = slideContent.match(/<p:txBody[^>]*>[\s\S]*?<\/p:txBody>/g);
            if (titleMatches) {
              titleMatches.forEach((match) => {
                const titleText = match
                  .replace(/<[^>]*>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                if (titleText) {
                  extractedText += titleText + '\n';
                }
              });
            }
          }

          if (extractedText.trim()) {
            onFileProcessed(extractedText);
          } else {
            setError('No text content found in the PPTX file');
          }
        } catch (pptxError) {
          setError('Failed to process PPTX file. Please try converting to PDF or DOCX format.');
        }
      }
    } catch (err) {
      setError('Failed to process the file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className='file-upload-container'>
      <div className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={handleClick}>
        <input ref={fileInputRef} type='file' accept={acceptedTypes.join(',')} onChange={handleFileInputChange} style={{ display: 'none' }} />

        {isProcessing ? (
          <div className='upload-content'>
            <div className='processing-spinner'></div>
            <p className='upload-text'>Processing file...</p>
          </div>
        ) : (
          <div className='upload-content'>
            <svg className='upload-icon' width='48' height='48' viewBox='0 0 24 24' fill='none'>
              <path d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
            <p className='upload-text'>Drop your {acceptedTypes.join(', ')} file here or click to browse</p>
            <p className='upload-subtext'>Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className='upload-error'>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
            <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
            <line x1='15' y1='9' x2='9' y2='15' stroke='currentColor' strokeWidth='2' />
            <line x1='9' y1='9' x2='15' y2='15' stroke='currentColor' strokeWidth='2' />
          </svg>
          <div className='error-content'>{error}</div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
