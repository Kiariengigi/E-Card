"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { ReactFlipBook } from '@vuvandinh203/react-flipbook';
import styles from './cardview.module.css';
import { SlotKey, pageOrder } from '../../types'
import { supabase }  from '../../../lib/supabase'


interface BookProps { 
  pages?: Record<SlotKey, string | null>
  id?: string
}

const ASPECT_RATIO = 300 / 500;

function Book({ pages: initialPages, id }: BookProps) {

  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCoverPage, setIsCoverPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false)
  const currentIndexRef = useRef(0);
  const totalPages = pageOrder.length;

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pages, setPages] = useState<Record<SlotKey, string | null> | null>(initialPages ?? null)

  const [bookSize, setBookSize] = useState({ width: 300, height: 500}); 

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

  const recalcSize = useCallback(() => {
    const el = containerRef.current; 
    if (!el) return; 

    const isMobile = window.innerWidth < 768; 
    setIsMobileView(isMobile)
    console.log(isMobile)

    const availableWidth = el.clientWidth || window.innerWidth; 
    const availableHeight = isMobile 
      ? window.innerHeight * 0.72 
      : window.innerHeight * 0.85; 
    
    let width: number; 

    if (isMobile) {
      width = Math.min(availableWidth * 0.92, 420);
    } else {
      width = Math.min(availableWidth / 2 - 24, 420)
    }
    let height = width / ASPECT_RATIO; 

    if (height > availableHeight) {
      height = availableHeight; 
      width = height * ASPECT_RATIO
    }

    width = Math.max(width, 160); 
    height = Math.max(height, width / ASPECT_RATIO)

    setBookSize({ width: Math.round(width), height: Math.round(height) })
  }, []);

  useEffect(() => {
    if (loading) return
    recalcSize(); 

    const el = containerRef.current; 
    const resizeObserver = new ResizeObserver(() => recalcSize()); 
    if (el) resizeObserver.observe(el); 

    window.addEventListener('resize', recalcSize); 
    window.addEventListener('orientationchange', recalcSize);

    return () => {
      resizeObserver.disconnect(); 
      window.removeEventListener('resize', recalcSize);
      window.removeEventListener('orientationchange', recalcSize);
    }
  }, [recalcSize, loading])

  const computeIsCover = (index: number) =>
    index === 0 || index === totalPages - 1;

  const computeIsLastPage = (index: number) => index === totalPages - 1;

  // fires in the capture phase, before the library's own click handler runs
  const handleFlip = useCallback((e: { data: number }) => {
    const newIndex = e.data; 
    currentIndexRef.current = newIndex; 
    setIsCoverPage(computeIsCover(newIndex)); 
    setIsLastPage(computeIsLastPage(newIndex))
  }, [totalPages]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
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
    <div ref={containerRef} onMouseMove={handleMouseMove} className='flex items-center justify-center w-full min-h-[70vh] px-2 py-4 sm:px-6 sm:py-8 overflow-visible'>
      <ReactFlipBook
        key={isMobileView ? 'mobile' : 'desktop'}
        width={bookSize.width}
        height={bookSize.height}
        size="fixed"
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={false}
        usePortrait={isMobileView}
        autoSize
        swipeDistance={100}
        showPageCorners={false}
        ref={flipBookRef}
        onFlip={handleFlip}
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