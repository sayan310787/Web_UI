/*Global Variables Section*/

var formMode = 'ADD';
var currentProductId;
var productList = [];
var categoryFilter = [];

/*End of Global Variables*/

if (!String.prototype.includes) {
String.prototype.includes = function(search, start) {
  if (typeof start !== 'number') {
                start = 0;
  }

  if (start + search.length > this.length) {
                return false;
  } else {
                return this.indexOf(search, start) !== -1;
 }
};
}

// A $(document).ready() block.
$(document).ready(function() {
                $('#submit-button').click(addEditProduct);
                $('#cancel-button').click(resetForm);
});

//Get List of Products from the database
function getProducts() {
                $.get( "http://localhost:3000/products", function( res ) {
                  for (eachProduct in res.data) {
                                showProduct(res.data[eachProduct]);
                  }
                });
}

//Initial call to populate the Products list the first time the page loads
getProducts();

function showProduct (product, isEditMode) {
                if (isEditMode) {
                                var html = $("#product-"+product._id);
                                removeFromProductList(product._id);
                } else {
                                var html = $('#product-struct').clone();
                }
                var imgPath = './images/product.png';
                if (product.hasOwnProperty('productImg')) {
                                imgPath = './images/Product/'+product.productImg.fileName;
                }
                html.find('img').attr('src', imgPath);
                html.find('.product-title').text(product.name);
                html.find('.product-summary').text(product.description);
                html.find('.product-category').text(product.category);
                html.find('.product-price').text('Rs ' + product.price);
                html.removeClass("hide-display");
                html.find('a.remove-button').click({id: product._id, category: product.category}, removeProduct);
                html.find('a.edit-button').click({id: product._id}, editProduct);
                if (!isEditMode) {
                                html.attr("id","product-"+product._id);
                                html.addClass('filter-enabled');
                                html.find('.upload-button').click(function () {
                                                $(this).prev('input:file').trigger('click');
                                });
                                html.find('input:file').change({id: product._id}, uploadImage);
                                html.find('img').attr('id','img-'+product._id);
                                $('#product-list').append(html);
                }
                
                addInProductList(product);
                showCategory(product.category, product);
                
}

function addInProductList (product) {
                productList.push(product);
}

function removeFromProductList (productId) {
                productList = productList.filter(function( obj ) {
      return obj._id !== productId;
    });
}

/*Remove Product*/
function removeProduct(eventData) {
                $("#myModal").modal();
                $('#myModal').on('shown.bs.modal', function (e) {
                  $('#myModal .final-remove').click(function () {
                                                $.ajax({
                                                  url: "http://localhost:3000/product/"+eventData.data.id,
                                                  method: 'DELETE'
                                                }).done(function() {
                                                  $('#product-list #product-'+eventData.data.id).remove();
                                                  var hasCat = $(".product-category").filter(function() { return $(this).text().toLowerCase() === eventData.data.category.toLowerCase(); }).length;
                                                  if (!hasCat) {
                                                                  $("#catName-"+eventData.data.category.toLowerCase()).remove();
                                                  }
                                                  removeFromProductList(eventData.data.id);
                                                  showMessage('action-success-message', 'Successfully removed');
                                                  $("#myModal").modal('hide');
                                                });
                                   
                  });
                })
}

/*Update Product*/
function editProduct(eventData) {
                $('#form-title').text('Edit Product');
                $('#submit-button').text('Update');
                currentProductId = eventData.data.id;
                
                $.get( "http://localhost:3000/product/"+eventData.data.id, function( res ) {
                                $('#product-name').val(res.data.name);
                                $('#product-cat').val(res.data.category);
                                $('#product-price').val(res.data.price);
                    $('#product-desc').val(res.data.description);
                                formMode = "UPDATE";
                });
                
}

function addEditProduct(eventData) {
                event.preventDefault();
                var fieldHasValueCount = $("#form input[type=text],textarea").filter(function() { return $(this).val(); }).length;
                if (fieldHasValueCount === 4) {
                                if (!isNaN($('#product-price').val())) {
                                  $('#form-validation-msg').addClass("hide-display");      
                                  var data = {
                                                name: $('#product-name').val(),
                                                category: $('#product-cat').val(),
                                                price: $('#product-price').val(),
                                                description: $('#product-desc').val()
                                  };
                                  
                                  if (formMode == "UPDATE") {
                                                  $.ajax({
                                                                  url: "http://localhost:3000/product/"+currentProductId,
                                                                  data: data,
                                                                  method: 'PUT'
                                                  }).done(function(res) {
                                                                  resetForm(event);
                                                                  $('#form-title').text('Add Product');
                              $('#submit-button').text('Save');
                                                                  showProduct(res.data, true);
                                                                  showMessage('action-success-message','Product is updated');
                                                                  formMode = 'ADD';
                                                                  currentProductId = null;
                                                  }).fail(function() {
                                                                showMessage('action-success-message','Product is not updated', true);
                                                });
                                  } else {
                                                  $.post("http://localhost:3000/product", data, function( res ) {
                                                                resetForm(event);
                                                                showProduct(res.data);
                                                                showMessage('action-success-message','Product is added');
                                                  })
                                                  .fail(function() {
                                                                showMessage('action-success-message','Product is not added', true);
                                                });
                                  }
                                  
                                } else {
                                                showMessage('form-validation-msg','Price can\'t be string');
                                }
                                                  
                }else {
                  showMessage('form-validation-msg','Please Fill all Fields');
                }
}

function resetForm(event) {
   event.preventDefault();
   $("#form")[0].reset();
}

function showMessage (elementId, msg, isErrorMsg) {
   $('#'+elementId).text(msg);
   if (isErrorMsg) {
                  $('#'+elementId).addClass('alert-danger');
   } else {
                  $('#'+elementId).addClass('alert-success');
   }
   $('#'+elementId).removeClass("hide-display");
}

function showCategory (categoryName, product) {
                var catExist = $("#catName-"+categoryName.toLowerCase()).length;
                if (!catExist) {
                                var html = $('#category-item').clone();
                                html.text(categoryName);
                                html.attr('id', 'catName-'+categoryName.toLowerCase());
                                html.removeClass('hide-display');
                                $('#category-list').append(html);
                }              
}


//Code block for Free Text Search
$(document).ready(function() {
    $("#searchText").keyup(function() {
                  var keyWord = $("#searchText").val().toLowerCase();
                  if (keyWord.length > 2) {
                    for(eachProduct in productList) {
                       if (!productList[eachProduct].name.toLowerCase().includes(keyWord) &&
                                       !productList[eachProduct].category.toLowerCase().includes(keyWord) &&
                                                   !productList[eachProduct].price.toString().toLowerCase().includes(keyWord) &&
                                                   !productList[eachProduct].description.toLowerCase().includes(keyWord)) {
                                                                   $('#product-'+productList[eachProduct]._id).addClass('hide-display');
                                   }
                    } 
                  } else if (keyWord.length === 0) {
        filterByCategory();
                  }              
    });

});

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var elementObj = $('#'+ev.dataTransfer.getData("text")).clone();
    var keyWord = elementObj.text().toLowerCase();       
                elementObj.attr('id', 'cat-filter-chip-'+keyWord);
    $('#cat-filter').append(elementObj);
                elementObj.after('<i class="glyphicon glyphicon-remove-sign text-danger remove-cat-filter"></i>');
                $('#cat-filter-chip-'+keyWord).next('i').click({cat: keyWord}, removeCategoryFilter);       
                if (categoryFilter.indexOf(keyWord) < 0) {
                                categoryFilter.push(keyWord);
                }
                filterByCategory();
}

function removeCategoryFilter (eventData) {
                var index = categoryFilter.indexOf(eventData.data.cat);
    categoryFilter.splice(index, 1);
                $('#cat-filter-chip-'+eventData.data.cat).next('i').remove();
                $('#cat-filter-chip-'+eventData.data.cat).remove();
                filterByCategory();
}

function filterByCategory () {
                if (categoryFilter.length === 0) {
                                $('.filter-enabled').removeClass('hide-display');
                } else {
                                $('.filter-enabled').addClass('hide-display');
                                for(eachProduct in productList) {
                                   if (categoryFilter.indexOf(productList[eachProduct].category.toLowerCase()) >= 0) {
                                                $('#product-'+productList[eachProduct]._id).removeClass('hide-display');
                                   }
                                }
                }

    if ($("#searchText").val().length !== 0) {
        $("#searchText").trigger("keyup");
                }              
}

function uploadImage (eventData) {
                var formData = new FormData();
                formData.append('file', $(this)[0].files[0]);

                var url = 'http://localhost:3000/product/'+eventData.data.id+'/ProductImg';
                $.ajax({
                                   url : url,
                                   type : 'PUT',
                                   data : formData,
                                   processData: false,  // tell jQuery not to process the data
                                   contentType: false,  // tell jQuery not to set contentType
                                   success : function(res) {
                                                   $.get( "http://localhost:3000/product/"+eventData.data.id, function( res ) {
                                                                                var imgPath = './images/Product/'+res.data.productImg.fileName;
                                                        $('#img-'+eventData.data.id).attr('src', '');
                                                        $('#img-'+eventData.data.id).attr('src', imgPath);
                                                                });                                              
                                   }
                });
}
