import { type SchemaTypeDefinition } from "sanity";
// documents
import navigation from "./schemas/documents/navigation";
import settings from "./schemas/documents/settings";
import account from "./schemas/documents/account";
import signup from "./schemas/documents/signup";
import event from "./schemas/documents/event";
import sponsorship from "./schemas/documents/sponsorship";
import workItem from "./schemas/documents/workItem";
import clientRequest from "./schemas/documents/clientRequest";
import clientService from "./schemas/documents/clientService";
import serviceRequest from "./schemas/documents/serviceRequest";
import messageThread from "./schemas/documents/messageThread";
import announcement from "./schemas/documents/announcement";
import feedback from "./schemas/documents/feedback";
import auditLog from "./schemas/documents/auditLog";
import featureFlag from "./schemas/documents/featureFlag";
import analyticsRecord from "./schemas/documents/analyticsRecord";
import analyticsNote from "./schemas/documents/analyticsNote";
import analyticsIngestionConfig from "./schemas/documents/analyticsIngestionConfig";
import invoice from "./schemas/documents/invoice";
import billingProfile from "./schemas/documents/billingProfile";
import documentItem from "./schemas/documents/documentItem";
import scheduleItem from "./schemas/documents/scheduleItem";
import page from "./schemas/documents/page";
import post from "./schemas/documents/post";
import category from "./schemas/documents/category";
import author from "./schemas/documents/author";
import faq from "./schemas/documents/faq";
import testimonial from "./schemas/documents/testimonial";

// shared/object types
import blockContent from "./schemas/blocks/shared/block-content";
import hero1 from "./schemas/blocks/hero/hero-1";
import hero2 from "./schemas/blocks/hero/hero-2";
import sectionHeader from "./schemas/blocks/section-header";
import splitRow from "./schemas/blocks/split/split-row";
import gridRow from "./schemas/blocks/grid/grid-row";
import carousel1 from "./schemas/blocks/carousel/carousel-1";
import carousel2 from "./schemas/blocks/carousel/carousel-2";
import timelineRow from "./schemas/blocks/timeline/timeline-row";
import cta1 from "./schemas/blocks/cta/cta-1";
import logoCloud1 from "./schemas/blocks/logo-cloud/logo-cloud-1";
import faqs from "./schemas/blocks/faqs";
import formNewsletter from "./schemas/blocks/forms/newsletter";
import allPosts from "./schemas/blocks/all-posts";
// additional blocks and shared objects
import gridCard from "./schemas/blocks/grid/grid-card";
import gridPost from "./schemas/blocks/grid/grid-post";
import pricingCard from "./schemas/blocks/grid/pricing-card";
import splitCard from "./schemas/blocks/split/split-card";
import splitCardsList from "./schemas/blocks/split/split-cards-list";
import splitContent from "./schemas/blocks/split/split-content";
import splitImage from "./schemas/blocks/split/split-image";
import splitInfoList from "./schemas/blocks/split/split-info-list";
import splitInfo from "./schemas/blocks/split/split-info";
import timelines1 from "./schemas/blocks/timeline/timelines-1";
import { buttonVariant } from "./schemas/blocks/shared/button-variant";
import { colorVariant } from "./schemas/blocks/shared/color-variant";
import link from "./schemas/blocks/shared/link";
import sectionPadding from "./schemas/blocks/shared/section-padding";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    navigation,
    settings,
    account,
    signup,
    event,
    sponsorship,
    workItem,
    clientRequest,
    clientService,
    serviceRequest,
    messageThread,
    announcement,
    feedback,
    auditLog,
    featureFlag,
    analyticsRecord,
    analyticsNote,
    analyticsIngestionConfig,
    invoice,
    billingProfile,
    documentItem,
    scheduleItem,
    // documents
    page,
    post,
    category,
    author,
    faq,
    testimonial,
    // objects/blocks
    blockContent,
    hero1,
    hero2,
    sectionHeader,
    splitRow,
    gridRow,
    carousel1,
    carousel2,
    timelineRow,
    cta1,
    logoCloud1,
    faqs,
    formNewsletter,
    allPosts,
    // extra blocks + shared objects
    gridCard,
    gridPost,
    pricingCard,
    splitCard,
    splitCardsList,
    splitContent,
    splitImage,
    splitInfoList,
    splitInfo,
    timelines1,
    buttonVariant,
    colorVariant,
    link,
    sectionPadding,
  ],
};
