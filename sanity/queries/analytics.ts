import { groq } from "next-sanity";

export const ANALYTICS_QUERY = groq`
  *[_type == "analyticsRecord"] | order(metricDate desc) {
    _id,
    client->{
      _id,
      name,
      businessName
    },
    metric,
    value,
    period,
    metricDate,
    note,
    visibility
  }
`;
