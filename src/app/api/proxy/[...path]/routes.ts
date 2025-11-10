// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_BASE_URL } from '@/lib/api/config';

// Helper function to handle all request methods
async function handleProxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string = 'GET'
) {
  try {
    const path = params.path.join('/');
    const url = `${BACKEND_BASE_URL}/${path}`;
    
    console.log(`🔄 PROXY: ${method} ${url}`);
    console.log(`📡 Backend Base: ${BACKEND_BASE_URL}`);
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Forward authorization header if present
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (method !== 'GET') {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
        console.log(`📦 Request body:`, body);
      } catch (e) {
        console.log('📦 No request body or invalid JSON');
      }
    }

    // Make the request to the actual backend
    const response = await fetch(url, options);
    
    console.log(`📡 Backend response status: ${response.status}`);

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Invalid JSON response', status: response.status };
    }
    
    console.log(`✅ PROXY SUCCESS: ${method} ${url} - Status: ${response.status}`);
    console.log(`📨 Response data:`, data);
    
    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error(`❌ PROXY ERROR: ${error.message}`);
    console.error(`🔧 Error details:`, error);
    
    return NextResponse.json(
      { 
        error: 'Backend connection failed',
        message: error.message,
        url: `${BACKEND_BASE_URL}/${params.path.join('/')}`
      },
      { status: 500 }
    );
  }
}

// Handle POST requests
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'POST');
}

// Handle GET requests
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'GET');
}

// Handle PUT requests
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'PUT');
}

// Handle PATCH requests
export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'PATCH');
}

// Handle DELETE requests
export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'DELETE');
}