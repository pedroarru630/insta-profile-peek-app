
interface InstagramProfile {
  username: string;
  full_name?: string;
  profile_pic_url: string;
  exists: boolean;
}

interface ApifyResponse {
  urlsFromSearch?: string[];
  data?: {
    items?: Array<{
      username: string;
      fullName?: string;
      profilePicUrlHD?: string;
    }>;
  };
}

export class InstagramService {
  private static APIFY_API_URL = 'https://api.apify.com/v2/actor-tasks/chatty_coaster~instagram-scraper-task/run-sync?token=apify_api_Tk435sUb2WnBllXsxxfNQaBLkHSZyz0HLRCO';

  static async getProfile(username: string): Promise<InstagramProfile> {
    try {
      console.log('Fetching Instagram profile for:', username);
      
      const cleanUsername = username.replace('@', '');
      
      const response = await fetch(this.APIFY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addParentData: false,
          enhanceUserSearchWithFacebookPage: false,
          isUserReelFeedURL: false,
          isUserTaggedFeedURL: false,
          resultsLimit: 200,
          resultsType: "posts",
          search: cleanUsername,
          searchLimit: 1,
          searchType: "user"
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const responseJson: ApifyResponse = await response.json();
      console.log('Full Apify API response:', responseJson);

      // Check if we have URLs from search (indicates profile exists)
      if (responseJson.urlsFromSearch && responseJson.urlsFromSearch.length > 0) {
        const instagramUrl = responseJson.urlsFromSearch[0];
        console.log('Profile URL found:', instagramUrl);
        
        // Extract username from URL if possible
        const urlUsername = instagramUrl.match(/instagram\.com\/([^\/]+)/)?.[1] || cleanUsername;
        
        // Check if we also have detailed profile data with profile picture
        const items = responseJson.data?.items || [];
        let profilePicUrl = '/placeholder.svg';
        let fullName = urlUsername;
        
        if (items.length > 0) {
          const profileData = items[0];
          console.log('Profile data found:', profileData);
          
          // Extract profile picture URL - this is the key fix
          if (profileData.profilePicUrlHD) {
            profilePicUrl = profileData.profilePicUrlHD;
            console.log('Profile picture URL extracted:', profilePicUrl);
          }
          
          if (profileData.fullName) {
            fullName = profileData.fullName;
          }
        }
        
        const finalProfile = {
          username: urlUsername,
          full_name: fullName,
          profile_pic_url: profilePicUrl,
          exists: true
        };
        
        console.log('Final profile object being returned:', finalProfile);
        return finalProfile;
      }

      // Fallback for legacy format
      const items = responseJson.data?.items || [];
      if (items.length > 0) {
        const profileData = items[0];
        console.log('Profile data found in legacy format:', profileData);
        
        return {
          username: profileData.username || cleanUsername,
          full_name: profileData.fullName,
          profile_pic_url: profileData.profilePicUrlHD || '/placeholder.svg',
          exists: true
        };
      }

      console.log('No profile data returned from API');
      return {
        username: cleanUsername,
        full_name: undefined,
        profile_pic_url: '/placeholder.svg',
        exists: false
      };
      
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      return {
        username: username.replace('@', ''),
        full_name: undefined,
        profile_pic_url: '/placeholder.svg',
        exists: false
      };
    }
  }
}
