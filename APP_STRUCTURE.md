# OurShow App Structure

## 📋 Data Structure

### Firebase Realtime Database Paths

```
ourshow/
  users/
    {userId}/
      watchlist/     → Items ALREADY WATCHED (shown in stats)
      watchlater/    → Items WANT TO WATCH (saved for later)
      watched/       → (Optional - not currently used)
      seriesProgress/ → Series episode progress tracking
```

## 🎯 Terminology

### Watchlist (`watchlist.html`)
- **Purpose**: Items you've **already watched**
- **Used for**: Statistics, tracking what you've seen
- **Firebase Path**: `ourshow/users/{uid}/watchlist/`
- **localStorage Key**: `ourshow_watchlist`

### Watch Later (`watchlater.html`)
- **Purpose**: Items you **want to watch** later
- **Used for**: Saving items for future viewing
- **Firebase Path**: `ourshow/users/{uid}/watchlater/`
- **localStorage Key**: `ourshow_watchlater`

## 📊 Stats Page

The stats page (`stats.html`) displays:
- Items from **Watchlist** (items you've already watched)
- Total watched count
- Movies vs Series breakdown
- Watch streak
- Favorite genres
- Calendar view of watched items
- Recently watched items

## 🔄 Data Flow

1. **Mark as Watched** → Saves to `watchlist` path
2. **Add to Watch Later** → Saves to `watchlater` path
3. **Stats Page** → Reads from `watchlist` path
4. **Watchlist Page** → Shows items from `watchlist` path
5. **Watch Later Page** → Shows items from `watchlater` path

## ✅ Fixed Issues

- Stats now correctly reads from `watchlist` path (not `watched` path)
- `markAsWatched()` function saves to `watchlist` path
- `loadWatchedItems()` loads from `watchlist` path
- Firebase rules allow access to both `watchlist` and `watchlater`

