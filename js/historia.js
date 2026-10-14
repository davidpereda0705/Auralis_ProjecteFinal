document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.querySelector('.image-dialog');
    const enlargedImage = dialog.querySelector('.image-dialog-content');
    const closeButton = dialog.querySelector('.image-dialog-close');
    const chapterImages = document.querySelectorAll('.chapter-image img[role="button"]');
    let activeImage = null;

    function openImage(image) {
        if (!image.complete || image.naturalWidth === 0) return;

        activeImage = image;
        enlargedImage.src = image.src;
        enlargedImage.alt = image.alt;
        dialog.showModal();
        closeButton.focus();
    }

    function closeImage() {
        if (dialog.open) dialog.close();
    }

    chapterImages.forEach((image) => {
        image.addEventListener('click', () => openImage(image));
        image.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                openImage(image);
            }
        });
    });

    closeButton.addEventListener('click', closeImage);
    dialog.addEventListener('cancel', closeImage);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dialog.open) closeImage();
    });
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeImage();
    });
    dialog.addEventListener('close', () => {
        enlargedImage.removeAttribute('src');
        if (activeImage) activeImage.focus();
        activeImage = null;
    });
});
