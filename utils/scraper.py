
#!/usr/bin/env python3
import sys
import json
import requests
from bs4 import BeautifulSoup
import random
import time
import re
from urllib.parse import quote, urlencode

def scrape_pinterest(query):
    """Search for actual Pinterest images based on exact query"""
    try:
        images = []
        search_query = query.strip()
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        print(f"Searching for exact query: {query}", file=sys.stderr)
        
        # Try multiple Pinterest search approaches
        pinterest_urls = [
            f"https://www.pinterest.com/search/pins/?q={quote(search_query)}",
            f"https://in.pinterest.com/search/pins/?q={quote(search_query)}",
            f"https://www.pinterest.com/ideas/{quote(search_query.replace(' ', '-'))}/",
        ]
        
        for pinterest_url in pinterest_urls:
            try:
                print(f"Trying Pinterest URL: {pinterest_url}", file=sys.stderr)
                response = requests.get(pinterest_url, headers=headers, timeout=25)
                print(f"Pinterest response status: {response.status_code}", file=sys.stderr)
                
                if response.status_code == 200:
                    # Enhanced image patterns for Pinterest
                    image_patterns = [
                        r'"url":\s*"(https://i\.pinimg\.com/[^"]+\.(?:jpg|jpeg|png|webp))"',
                        r'"src":\s*"(https://i\.pinimg\.com/[^"]+\.(?:jpg|jpeg|png|webp))"',
                        r'data-src="(https://i\.pinimg\.com/[^"]+\.(?:jpg|jpeg|png|webp))"',
                        r'srcset="[^"]*?(https://i\.pinimg\.com/[^"]+\.(?:jpg|jpeg|png|webp))[^"]*?"',
                        r'"images":\s*{\s*"orig":\s*{\s*"url":\s*"(https://i\.pinimg\.com/[^"]+)"'
                    ]
                    
                    found_urls = set()
                    page_content = response.text
                    
                    for pattern in image_patterns:
                        matches = re.findall(pattern, page_content)
                        for match in matches:
                            clean_url = match.replace('\\u002F', '/').replace('\\', '').replace('\\/', '/')
                            if 'pinimg.com' in clean_url and len(clean_url) > 30:
                                # Always try to get highest quality
                                if '/236x/' in clean_url:
                                    clean_url = clean_url.replace('/236x/', '/originals/')
                                elif '/474x/' in clean_url:
                                    clean_url = clean_url.replace('/474x/', '/originals/')
                                elif '/564x/' in clean_url:
                                    clean_url = clean_url.replace('/564x/', '/originals/')
                                elif '/736x/' in clean_url:
                                    clean_url = clean_url.replace('/736x/', '/originals/')
                                found_urls.add(clean_url)
                    
                    if found_urls:
                        images = list(found_urls)[:8]
                        print(f"Found {len(images)} actual Pinterest images", file=sys.stderr)
                        break
                        
            except Exception as e:
                print(f"Pinterest URL {pinterest_url} error: {e}", file=sys.stderr)
                continue
        
        # If still no Pinterest images, use multi-source approach with better attribution
        if not images:
            print(f"No Pinterest images found for '{query}', using alternative sources", file=sys.stderr)
            
            # Try Google Images API endpoint (free tier)
            try:
                google_url = f'https://www.googleapis.com/customsearch/v1'
                # This would require API key, so fallback to scraping approach
                
                # Alternative: scrape Google Images directly
                google_search_url = f'https://www.google.com/search?q={quote(search_query + " pinterest")}&tbm=isch&safe=off'
                google_headers = headers.copy()
                google_headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                
                google_response = requests.get(google_search_url, headers=google_headers, timeout=15)
                if google_response.status_code == 200:
                    # Look for Pinterest image URLs in Google results
                    pinterest_pattern = r'"(https://i\.pinimg\.com/[^"]+\.(?:jpg|jpeg|png|webp))"'
                    pinterest_matches = re.findall(pinterest_pattern, google_response.text)
                    
                    for match in pinterest_matches[:6]:
                        if 'pinimg.com' in match:
                            # Convert to high quality
                            if '/236x/' in match:
                                match = match.replace('/236x/', '/originals/')
                            elif '/474x/' in match:
                                match = match.replace('/474x/', '/originals/')
                            images.append(match)
                
                if images:
                    print(f"Found {len(images)} Pinterest images via Google search", file=sys.stderr)
                
            except Exception as e:
                print(f"Google search error: {e}", file=sys.stderr)
        
        # Final fallback: High-quality stock images with query context
        if not images:
            print(f"Using high-quality stock images for '{query}'", file=sys.stderr)
            try:
                # Unsplash with better query handling
                unsplash_url = f'https://unsplash.com/napi/search/photos'
                params = {
                    'query': search_query,
                    'per_page': 8,
                    'order_by': 'relevant'
                }
                
                unsplash_headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Authorization': 'Client-ID your-unsplash-access-key'  # Would need API key
                }
                
                # Remove auth header for direct scraping
                del unsplash_headers['Authorization']
                
                unsplash_response = requests.get(unsplash_url, params=params, headers=unsplash_headers, timeout=15)
                
                if unsplash_response.status_code == 200:
                    try:
                        data = unsplash_response.json()
                        if 'results' in data:
                            for photo in data['results'][:6]:
                                if 'urls' in photo:
                                    img_url = photo['urls'].get('regular') or photo['urls'].get('small')
                                    if img_url:
                                        images.append(img_url)
                    except:
                        pass
                
            except Exception as e:
                print(f"Unsplash error: {e}", file=sys.stderr)
        
        if not images:
            return {'error': f'No images found for "{query}". Try different keywords or check your internet connection.'}
            
        return {'images': images, 'source': 'pinterest' if 'pinimg.com' in (images[0] if images else '') else 'stock'}
        
    except Exception as e:
        print(f"Image search error: {e}", file=sys.stderr)
        return {'error': str(e)}

def scrape_pokemon(pokemon_name):
    """Scrape Pokemon images and data"""
    try:
        # Try PokeAPI first
        api_url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_name.lower()}"
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Get Pokemon info
            pokemon_info = {
                'name': data['name'].title(),
                'id': data['id'],
                'types': [t['type']['name'].title() for t in data['types']],
                'images': []
            }
            
            # Collect images
            sprites = data.get('sprites', {})
            image_urls = []
            
            # Official artwork
            if sprites.get('other', {}).get('official-artwork', {}).get('front_default'):
                image_urls.append(sprites['other']['official-artwork']['front_default'])
            
            # Dream world
            if sprites.get('other', {}).get('dream_world', {}).get('front_default'):
                image_urls.append(sprites['other']['dream_world']['front_default'])
                
            # Home sprites
            if sprites.get('other', {}).get('home', {}).get('front_default'):
                image_urls.append(sprites['other']['home']['front_default'])
            
            # Regular sprites
            for key in ['front_default', 'front_shiny']:
                if sprites.get(key):
                    image_urls.append(sprites[key])
            
            pokemon_info['images'] = image_urls
            return pokemon_info
            
        else:
            return {'error': f'Pokemon "{pokemon_name}" not found'}
            
    except Exception as e:
        print(f"Pokemon scraping error: {e}", file=sys.stderr)
        return {'error': str(e)}

def scrape_youtube_music(query):
    """Enhanced YouTube music scraping with multiple fallbacks"""
    try:
        # Use yt-dlp for better YouTube support
        import subprocess
        import os
        
        # Search for the video first
        search_cmd = [
            'yt-dlp', 
            '--get-id', 
            '--get-title',
            '--get-duration',
            f'ytsearch1:{query}'
        ]
        
        result = subprocess.run(search_cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if len(lines) >= 3:
                video_id = lines[0]
                title = lines[1]
                duration = lines[2]
                
                return {
                    'success': True,
                    'video_id': video_id,
                    'title': title,
                    'duration': duration,
                    'url': f'https://www.youtube.com/watch?v={video_id}'
                }
        
        return {'error': 'No results found'}
        
    except Exception as e:
        print(f"YouTube scraping error: {e}", file=sys.stderr)
        return {'error': str(e)}

def scrape_image_search(query):
    """Search for images from multiple sources based on exact query"""
    try:
        images = []
        search_query = query.strip()
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        print(f"Searching for images: {query}", file=sys.stderr)
        
        # Try Unsplash first (high quality)
        try:
            unsplash_url = f'https://unsplash.com/napi/search/photos'
            params = {
                'query': search_query,
                'per_page': 12,
                'order_by': 'relevant'
            }
            
            unsplash_headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
            
            unsplash_response = requests.get(unsplash_url, params=params, headers=unsplash_headers, timeout=15)
            
            if unsplash_response.status_code == 200:
                try:
                    data = unsplash_response.json()
                    if 'results' in data and len(data['results']) > 0:
                        for photo in data['results'][:8]:
                            if 'urls' in photo:
                                img_url = photo['urls'].get('regular') or photo['urls'].get('small')
                                if img_url:
                                    images.append(img_url)
                        print(f"Unsplash found {len(images)} images", file=sys.stderr)
                except:
                    pass
                
        except Exception as e:
            print(f"Unsplash error: {e}", file=sys.stderr)
        
        # Try Pexels as backup
        if len(images) < 4:
            try:
                pexels_url = f'https://www.pexels.com/search/{quote(search_query)}/'
                
                pexels_response = requests.get(pexels_url, headers=headers, timeout=15)
                
                if pexels_response.status_code == 200:
                    # Find image URLs in Pexels page
                    pexels_patterns = [
                        r'src="(https://images\.pexels\.com/photos/[^"]+\.(?:jpg|jpeg|png|webp))"',
                        r'data-src="(https://images\.pexels\.com/photos/[^"]+\.(?:jpg|jpeg|png|webp))"'
                    ]
                    
                    for pattern in pexels_patterns:
                        pexels_matches = re.findall(pattern, pexels_response.text)
                        for match in pexels_matches[:6]:
                            if '?auto=compress' in match:
                                clean_match = match.split('?')[0] + '?auto=compress&cs=tinysrgb&w=1200'
                                if clean_match not in images:
                                    images.append(clean_match)
                            elif len(images) < 8:
                                if match not in images:
                                    images.append(match)
                
                print(f"Pexels added images, total: {len(images)}", file=sys.stderr)
                
            except Exception as e:
                print(f"Pexels error: {e}", file=sys.stderr)
        
        # Try Pixabay as final backup
        if len(images) < 4:
            try:
                pixabay_url = f'https://pixabay.com/images/search/{quote(search_query)}/'
                
                pixabay_response = requests.get(pixabay_url, headers=headers, timeout=15)
                
                if pixabay_response.status_code == 200:
                    # Find image URLs in Pixabay page
                    pixabay_pattern = r'data-lazy="(https://cdn\.pixabay\.com/photo/[^"]+\.(?:jpg|jpeg|png|webp))"'
                    pixabay_matches = re.findall(pixabay_pattern, pixabay_response.text)
                    
                    for match in pixabay_matches[:4]:
                        if match not in images:
                            # Get higher quality version
                            clean_match = match.replace('_640.', '_1280.')
                            images.append(clean_match)
                
                print(f"Pixabay added images, total: {len(images)}", file=sys.stderr)
                
            except Exception as e:
                print(f"Pixabay error: {e}", file=sys.stderr)
        
        if not images:
            return {'error': f'No images found for "{query}". Try different keywords like "nature", "art", "technology".'}
            
        return {'images': images, 'source': 'Multi-Source (Unsplash, Pexels, Pixabay)'}
        
    except Exception as e:
        print(f"Image search error: {e}", file=sys.stderr)
        return {'error': str(e)}

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: scraper.py <type> <query>'}))
        return
    
    scrape_type = sys.argv[1].lower()
    query = ' '.join(sys.argv[2:])
    
    if scrape_type == 'pokemon':
        result = scrape_pokemon(query)
    elif scrape_type == 'pinterest':
        result = scrape_pinterest(query)
    elif scrape_type == 'youtube':
        result = scrape_youtube_music(query)
    elif scrape_type == 'image_search':
        result = scrape_image_search(query)
    else:
        result = {'error': f'Unknown scrape type: {scrape_type}'}
    
    print(json.dumps(result))

if __name__ == '__main__':
    main()
