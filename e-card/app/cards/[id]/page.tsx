import React from 'react'; 
import Book from '../../components/cardview/book'
import { SlotKey, pageOrder } from '@/app/types';

interface CardPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CardViewPage({ params, searchParams }: CardPageProps) {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams

    const hasAllPagesInQuery = pageOrder.every(
        (key) => typeof resolvedSearchParams[key] === 'string'
    ); 

    if (hasAllPagesInQuery) {
        const pages = Object.fromEntries(
            pageOrder.map((key) => [key, resolvedSearchParams[key] as string])
        ) as Record<SlotKey, string | null>; 

        return (
            <main className='min-h-screen bg-gray-100 flex items-center justify-center'>
                <Book pages={pages}/>
            </main>
        )
    }

    return (
        <main className='min-h-screen bg-gray-100 flex items-center justify-center'>
            <Book id={resolvedParams.id} />
        </main>
    )
}