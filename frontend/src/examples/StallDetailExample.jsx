import React from 'react';
import SocialShare from '../components/SocialShare';
import SocialMediaLinks from '../components/SocialMediaLinks';
import './StallDetailExample.css';

/**
 * Example: How to integrate Social Media features into a Stall Detail page
 * 
 * This shows how to use:
 * 1. Social Sharing - Let users share the stall
 * 2. Social Media Links - Display stall's social media profiles
 */

const StallDetailExample = ({ stall }) => {
  // Example stall data structure
  // const stall = {
  //   stall_id: 123,
  //   name: "Ah Seng Chicken Rice",
  //   description: "Best chicken rice in Singapore!",
  //   image_url: "https://example.com/stall.jpg",
  //   hawker_centre_name: "Bedok Hawker Centre",
  //   facebook_url: "https://facebook.com/ahsengchickenrice",
  //   instagram_url: "https://instagram.com/ahsengchickenrice",
  //   website_url: "https://ahsengchickenrice.com"
  // };

  const currentUrl = window.location.href;

  return (
    <div className="stall-detail">
      {/* Header Section */}
      <div className="stall-header">
        <img 
          src={stall.image_url} 
          alt={stall.name}
          className="stall-image"
        />
        
        <div className="stall-info">
          <h1>{stall.name}</h1>
          <p className="stall-location">{stall.hawker_centre_name}</p>
          <p className="stall-description">{stall.description}</p>
          
          {/* Social Media Links - Displays stall's social profiles */}
          <div className="stall-social-section">
            <h3>Follow Us:</h3>
            <SocialMediaLinks 
              facebook={stall.facebook_url}
              instagram={stall.instagram_url}
              twitter={stall.twitter_url}
              tiktok={stall.tiktok_url}
              website={stall.website_url}
              size="medium"
              showLabels={true}
            />
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="stall-menu">
        <h2>Our Menu</h2>
        {/* Menu items here */}
      </div>

      {/* Social Share Section - Let visitors share this stall */}
      <div className="stall-share-section">
        <SocialShare 
          url={currentUrl}
          title={`Check out ${stall.name} at ${stall.hawker_centre_name}!`}
          description={stall.description}
          imageUrl={stall.image_url}
        />
      </div>

      {/* Reviews Section */}
      <div className="stall-reviews">
        <h2>Reviews</h2>
        {/* Reviews here */}
      </div>
    </div>
  );
};

export default StallDetailExample;
