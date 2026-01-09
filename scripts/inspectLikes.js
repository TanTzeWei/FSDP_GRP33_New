const supabase = require('../dbConfig');

(async () => {
  try {
    console.log('Fetching photo_likes rows...');
    const { data: likes, error: likesErr } = await supabase.from('photo_likes').select('*').limit(50);
    if (likesErr) {
      console.error('Error fetching photo_likes:', likesErr);
    } else {
      console.log('photo_likes:', likes);
    }

    console.log('\nFetching photos rows...');
    const { data: photos, error: photosErr } = await supabase.from('photos').select('id, dish_name, likes_count').limit(50);
    if (photosErr) {
      console.error('Error fetching photos:', photosErr);
    } else {
      console.log('photos:', photos);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
})();
