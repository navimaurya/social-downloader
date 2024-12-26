async function downloader(e){
    e.preventDefault();
    const urlInput = document.getElementById('url').value;
    const reelId = urlInput.match(/\/reel\/([A-Za-z0-9_-]+)/)?.[1];

    if (!reelId) {
        alert('Invalid Instagram reel URL. Please try again.');
        return;
    }

    try {
        const response = await fetch('/proxy/instagram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: urlInput
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const media = data?.data?.xdt_shortcode_media;

        if (media) {
            // Update video poster and source
            debugger
            document.getElementById('video').poster = data.data.poster ? `data:image/jpeg;base64,${data.data.poster}` : media.thumbnail_src;
            document.getElementById('videoSource').src = media.video_url;
            document.getElementById('video').style.display = 'block';

            // Update download button
            const downloadButton = document.getElementById('downloadButton');
            downloadButton.href = media.video_url;
            downloadButton.classList.remove('hidden');

            // Show result section
            document.getElementById('resultSection').classList.remove('hidden');
        } else {
            alert('Failed to fetch reel details.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`An error occurred. Please try again. ${error.message}`);
    }
}
document.getElementById('reelForm').addEventListener('submit',downloader);