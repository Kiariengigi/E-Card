import React from 'react'; 
import Book from '../../components/cardview/book'

interface CardPageProps {
    params: Promise<{ id: string }>;
}

export default async function CardViewPage({ params }: CardPageProps) {
    const resolvedParams = await params
    return (
        <main className='min-h-screen bg-gray-100 flex items-center justify-center overflow-hidden'>
            <Book id={resolvedParams.id}/>
        </main>
    )
}