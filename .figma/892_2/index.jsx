import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.macBookPro141}>
      <div className={styles.rectangle220}>
        <div className={styles.autoWrapper}>
          <p className={styles.welcomeTommaso}>
            Welcome,
            <br />
            Tommaso!
          </p>
          <p className={styles.thanksForHelpingDist}>
            Thanks for helping distribute meals across Hong Kong!
          </p>
        </div>
        <p className={styles.youCanViewEventsAndM}>
          You can view events and manage your sponsoring
        </p>
        <div className={styles.rectangle222}>
          <div className={styles.rectangle223} />
        </div>
      </div>
      <div className={styles.rectangle221}>
        <div className={styles.rectangle226} />
        <div className={styles.rectangle227} />
        <div className={styles.rectangle227} />
      </div>
      <div className={styles.autoWrapper2}>
        <p className={styles.yourVolunteering}>Your Volunteering:</p>
        <p className={styles.volunteerNow}>Volunteer Now</p>
      </div>
    </div>
  );
}

export default Component;
