import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Path to your PDF file
    const filePath = path.join(process.cwd(), 'public', 'docs', 'diamond-rimz-terms-conditions.pdf');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // Create a placeholder if file doesn't exist
      return NextResponse.json(
        { 
          error: 'PDF document not found',
          message: 'Please upload the terms PDF to /public/docs/diamond-rimz-terms-conditions.pdf'
        },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fs.statSync(filePath).size;

    // Get filename from query params or use default
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get('filename') || 'diamond-rimz-terms-conditions.pdf';

    // Return PDF with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}