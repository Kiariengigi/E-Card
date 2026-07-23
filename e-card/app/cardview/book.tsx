import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { ReactFlipBook } from '@vuvandinh203/react-flipbook';
import styles from './cardview.module.css';
import img from '../../public/Assets/card-text1.png'

const textures = ['../../public/Assets/bart-wesolek-U2j1u4BWrpM-unsplash.jpg','../../public/Assets/olga-thelavart-vS3idIiYxX0-unsplash.jpg','../../public/Assets/resource-boy-zJBxYP-hIS8-unsplash.jpg','../../public/Assets/white-paper-texture-photo-white-card-very-high-resolution_1067001-21282.avif' ]

function Book({ ref }) {

  const flipBookRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCoverPage, setIsCoverPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(false);
  const currentIndexRef = useRef(0);
  const totalPages = 6;

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

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--lx', `${x}%`);
    e.currentTarget.style.setProperty('--ly', `${y}%`);
  }

  return (
    <div ref={containerRef} onClickCapture={handleClickCapture} onMouseMove={handleMouseMove} className='pl-75 pt-25'>
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
        <div className={styles.demoPage}>Page 1 (Cover)</div>
        <div className={styles.demoPage}>Page 2</div>
        <div className={styles.demoPage}>Page 3</div>
        <div className={styles.demoPage}>Page 4</div>
        <div className={styles.demoPage}>Page 5</div>
        <div className={styles.demoPage}>Page 6</div>
      </ReactFlipBook>
    </div>
  );
}

export default Book;