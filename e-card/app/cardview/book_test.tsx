import React from 'react';
import { ReactFlipBook } from '@vuvandinh203/react-flipbook';
import styles from './cardview.module.css';

function Book() {
  return (
    <ReactFlipBook
      width={300}
      height={500}
      showCover={true}
    >
      <div className={styles.demoPage}>Page 1 (Cover)</div>
      <div className={styles.demoPage}>Page 2</div>
      <div className={styles.demoPage}>Page 3</div>
      <div className={styles.demoPage}>Page 4</div>
      <div className={styles.demoPage}>Page 5</div>
      <div className={styles.demoPage}>Page 6</div>
    </ReactFlipBook>
  );
}

export default Book;