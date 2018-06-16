console.log('hi jens!');

(function() {

    var burgerMenu = document.getElementById('burger_menu');
    var sideMenu = document.getElementById('side_menu');
    var isVisible = false;

    burgerMenu.addEventListener('click', function() {
        if (isVisible) {
            sideMenu.style.left = '-12vw';
            isVisible = false;
        } else {
            sideMenu.style.left = '0';
            isVisible = true;
        }
    });

}());
