document.addEventListener('DOMContentLoaded', () => {
    const wishlistButtons = document.querySelectorAll('.btn-wishlist');

    wishlistButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            const icon = button.querySelector('i');
            
            if (button.classList.contains('active')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
            }
        });
    });
});
