define(['knockout-wrapper'], function (KnockoutWrapper) {
	var model = new KnockoutWrapper(document.querySelector('.container'));

	model.observe('organizations', communication.sendCommand('CRM.query.getOrganizationList')); // asynchronous function
	model.observe('editable', false);
	model.observe('exampleProduct', communication.sendCommand('Sales.query.getProduct', { productID: '8e45504e-f794-46a9-bd52-e9bbf488ca23' })); // asynchronous function

	model.apply().done(function () {
		var exampleOrganization = model.get('organizations')[0];

		if (String(exampleOrganization.accountType) === 'root') {
			model.modify('editable', true);
		}
	});
});