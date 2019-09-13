$(document).ready(function () {
	
	AOS.init();

	svg4everybody({});

	VK.Widgets.Group("vk_groups", {mode: 0, width: "auto", height: "400"}, 10763908);

	var slider = new Swiper('.review-slider', {
		pagination: {
			el: '.swiper-page',
			type: 'fraction',
		},
		navigation: {
			nextEl: '.swiper-next',
			prevEl: '.swiper-prev',
		},
	});

	var sliderPrice = new Swiper('.swiper-price', {
		simulateTouch: false,
		slidesPerView: 3,
		spaceBetween: 30,
		breakpoints: {
			// when window width is <= 320px
			768: {
				slidesPerView: 1,
				spaceBetween: 10
			},
			// when window width is <= 480px
			992: {
				slidesPerView: 2,
				spaceBetween: 20
			},
		}
	});

	$("form").submit(function() {
		var th = $(this);
		// /*modalSubmited();
		//  console.log(th.serialize())
		$.ajax({
			type: "POST",
			url: "mail.php", //Change
			data: th.serialize()
		}).done(function() {
			// $('#Modal').modal('hide')
			$('.fade.bd-example-modal-sm').modal('show')
			setTimeout(function() {
				// Done Functions
				th.trigger("reset");
			}, 1000);
		});
		return false;
	});

})