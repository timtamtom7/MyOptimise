import { defineQuery } from "next-sanity";

export const CAMPAIGN_BY_ID_QUERY = defineQuery(`
  *[_type == "campaign" && _id == $id][0] {
    _id,
    title,
    status,
    startDate,
    endDate,
    description,
    budget,
    "client": client->{
        _id,
        name,
        email,
        avatar,
        industry,
        audience,
        creativeGoal,
        brandVoice,
        brandAssets
    },
    "manager": manager->{
        _id,
        name,
        email,
        avatar
    },
    strategyDeck
  }
`);
