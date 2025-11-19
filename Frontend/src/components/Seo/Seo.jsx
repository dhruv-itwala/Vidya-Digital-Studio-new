import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * Simple SEO component. Fill title, description, canonical, openGraph as needed.
 */
export default function Seo({ title, description, canonical, image }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:type" content="website" />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}

// Usage Example:
{
  /* <Seo
        title="Your Studio — Professional Video Editing & Motion Design"
        description="We craft video editing, 2D/3D animation, UI/UX and web apps for brands. Fast turnaround — portfolio inside."
        canonical="https://yourdomain.com/"
        image="https://yourdomain.com/og/home.jpg"
      /> */
}
// ---------------------------------------------------------
