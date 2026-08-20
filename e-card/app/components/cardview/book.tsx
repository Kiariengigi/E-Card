"use client"

import React, { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { ReactFlipBook } from '@vuvandinh203/react-flipbook';
import styles from './cardview.module.css';
import { SlotKey, pageOrder } from '../../types'
import { supabase }  from '../../../lib/supabase'


interface BookProps { 
  pages?: Record<SlotKey, string | null>
  id?: string
}

function Book({ pages: initialPages, id }: BookProps) {

  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCoverPage, setIsCoverPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(false);
  const currentIndexRef = useRef(0);
  const totalPages = pageOrder.length;

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pages, setPages] = useState<Record<SlotKey, string | null> | null>(initialPages ?? null)

  useEffect(() => {
    if (!id) {
      setPages(initialPages ?? null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function getCard() {
      setLoading(true)
      const { data, error } = await supabase
        .from('Cards')
        .select('*')
        .eq('id', id)
        .single()
      
        if (cancelled) return 

        if (error || !data) {
          console.log("Error fetching card:", error)
          setNotFound(true)
        } else {
          setPages({
            frontPage: data.frontPage, 
            insideLeft: data.insideLeft, 
            insideRight: data.insideRight, 
            backPage: data.backPage
          })
        }
        setLoading(false)
    }
    getCard()

    return () => {
      cancelled = true
    }
  }, [id, initialPages])

  const computeIsCover = (index: number) =>
    index === 0 || index === totalPages - 1;

  const computeIsLastPage = (index: number) => index === totalPages - 1;

  // fires in the capture phase, before the library's own click handler runs
  const handleClickCapture = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickedRightHalf = e.clientX - rect.left > rect.width / 2;

    const current = currentIndexRef.current;
    const atStart = current === 0;
    const atEnd = current === totalPages - 1;

    let predictedNext = current;
    if (clickedRightHalf && !atEnd) {
      predictedNext = atStart ? current + 1 : Math.min(current + 2, totalPages - 1);
    } else if (!clickedRightHalf && !atStart) {
      predictedNext = atEnd ? current - 1 : Math.max(current - 2, 0);
    }

    currentIndexRef.current = predictedNext

    console.log(
      'click captured — side:', clickedRightHalf ? 'right' : 'left',
      '| current:', current,
      '| predicted next:', predictedNext,
      '| predicted isCover:', computeIsCover(predictedNext),
      '| predicted isLastPage:', computeIsLastPage(predictedNext)
    );

    setIsCoverPage(computeIsCover(predictedNext));
    setIsLastPage(computeIsLastPage(predictedNext));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--lx', `${x}%`);
    e.currentTarget.style.setProperty('--ly', `${y}%`);
  }

  if (loading) {
    return <div className="pl-75 pt-15">Loading Card...</div>
  }

  if (notFound || !pages) {
    return <div className='pl-75 pt-15'>Card Not Found</div>
  }

  return (
    <div ref={containerRef} onClickCapture={handleClickCapture} onMouseMove={handleMouseMove} className='pl-75 pt-15'>
      <ReactFlipBook
        width={300}
        height={500}
        size="fixed"
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={false}
        autoSize
        swipeDistance={100}
        showPageCorners={false}
        ref={flipBookRef}
        className={clsx(
          styles.book_control,
          !isCoverPage && styles.contentPageStyle,
          isCoverPage && styles.coverPageStyle,
          isLastPage && styles.lastPageStyle, 
          styles.flip_container
        )}
      >
        {pageOrder.map((slotKey) => {
        const src = pages[slotKey]
        return (
          <div key={slotKey} className={styles.demopage}>
            {src ? (
              <img src={src} alt={slotKey} className={styles.pageImage} />
            ) : null}
          </div>
        )
      })}
      </ReactFlipBook>
    </div>
  );
}

export default Book