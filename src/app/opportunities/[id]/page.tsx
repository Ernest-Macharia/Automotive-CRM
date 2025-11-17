// src/app/opportunities/[id]/page.tsx
import { OpportunityClientPage } from './client-page';

// This runs at BUILD TIME to pre-render all opportunity pages
export async function generateStaticParams() {
  console.log('🔄 Generating static params for opportunities...');
  
  try {
    // Fetch opportunities from your API at BUILD TIME
    const res = await fetch('https://mag-backend-0gn4.onrender.com/api/v1/opportunities', {
      cache: 'force-cache', // Important: use cache for static generation
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`❌ API responded with status: ${res.status}`);
      throw new Error(`Failed to fetch opportunities: ${res.status}`);
    }

    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ Expected array from API, got:', typeof data);
      return [];
    }

    // Extract valid IDs from the response
    const params = data
      .filter((opportunity: any) => {
        const isValid = opportunity?.id && String(opportunity.id).trim() !== '';
        if (!isValid) {
          console.warn('⚠️ Skipping opportunity with invalid ID:', opportunity);
        }
        return isValid;
      })
      .map((opportunity: any) => ({
        id: String(opportunity.id),
      }));

    console.log(`✅ Pre-rendering ${params.length} opportunity pages`);
    
    // If no opportunities found, return at least one fallback
    if (params.length === 0) {
      console.warn('⚠️ No valid opportunities found, using fallback');
      return [{ id: 'default' }];
    }

    return params;

  } catch (error) {
    console.error('❌ Failed to generate static params:', error);
    
    // Fallback for build time - return empty array or a fallback ID
    return [{ id: 'fallback' }];
  }
}

// Optional: Generate metadata for each page
export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const res = await fetch(`https://mag-backend-0gn4.onrender.com/api/v1/opportunities/${params.id}`, {
      cache: 'force-cache',
    });

    if (res.ok) {
      const opportunity = await res.json();
      return {
        title: opportunity.subject || 'Opportunity Details',
        description: `View details for ${opportunity.subject || 'this opportunity'}`,
      };
    }
  } catch (error) {
    console.error('Failed to generate metadata:', error);
  }

  return {
    title: 'Opportunity Details',
    description: 'View opportunity details',
  };
}

// Main page component - pass params to client component
export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  return <OpportunityClientPage />;
}

// Important: Allow dynamic params for non-pre-rendered routes
export const dynamicParams = true;