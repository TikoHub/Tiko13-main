from django import template
import urllib.parse

register = template.Library()

@register.filter
def convert_to_embed_url(url):
    # Extract the video id from the URL
    query = urllib.parse.urlparse(url)
    video_id = urllib.parse.parse_qs(query.query).get('v')
    if video_id:
        # Return the embeddable URL
        return f'https://www.youtube.com/embed/{video_id[0]}'
    return url  # Return the original URL if no video id is found
