import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.macBookPro142}>
      <div className={styles.rectangle220}>
        <div className={styles.autoWrapper}>
          <p className={styles.helpDistributeMealsA}>
            Help distribute meals across Hong Kong
          </p>
          <p className={styles.joinAsAVolunteerOrSp}>
            Join as a volunteer or sponsor distributions to support elderly and
            low‑income communities.
          </p>
        </div>
        <div className={styles.autoWrapper2}>
          <div className={styles.rectangle222}>
            <div className={styles.rectangle223} />
          </div>
          <p className={styles.volunteerNow}>Volunteer Now</p>
          <div className={styles.rectangle224}>
            <div className={styles.rectangle225} />
          </div>
          <p className={styles.sponsorMeals}>Sponsor Meals</p>
        </div>
        <p className={styles.oR}>OR</p>
      </div>
    </div>
  );
}

export default Component;
