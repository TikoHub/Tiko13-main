from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from store.models import Book
from decimal import Decimal
from django.conf import settings


class Cart(object):
    def __init__(self, request):
        self.session = request.session
        cart = self.session.get(settings.CART_SESSION_ID)
        if not cart:
            cart = self.session[settings.CART_SESSION_ID] = {}
        self.cart = cart

    def add(self, book):
        book_id = str(book.id)
        if book_id not in self.cart:
            self.cart[book_id] = {'quantity': 0, 'price': str(book.price)}
            self.cart[book_id]['quantity'] = 1
        else:
            if self.cart[book_id]['quantity'] < 10:
                self.cart[book_id]['quantity'] += 1

        self.save()

    def update(self, book, quantity):
        book_id = str(book.id)
        self.cart[book_id]['quantity'] = quantity

        self.save()

    def save(self):
        self.session[settings.CART_SESSION_ID] = self.cart
        self.session.modified = True

    def remove(self, book):
        book_id = str(book.id)
        if book_id in self.cart:
            del self.cart[book_id]
            self.save()

    def __iter__(self):
        book_ids = self.cart.keys()
        books = Book.objects.filter(id__in=book_ids)
        for book in books:
            self.cart[str(book.id)]['book'] = book

        for item in self.cart.values():
            item['price'] = Decimal(item['price'])
            item['total_price'] = item['price'] * item['quantity']
            yield item

    def __len__(self):
        return sum(item['quantity'] for item in self.cart.values())

    def get_total_price(self):
        return sum(Decimal(item['price']) * item['quantity'] for item in self.cart.values())

    def clear(self):
        del self.session[settings.CART_SESSION_ID]
        self.session.modified = True


def cart_add(request, bookid):
    cart = Cart(request)
    book = get_object_or_404(Book, id=bookid)
    cart.add(book=book)

    return redirect('store/default.html')


def cart_update(request, bookid, quantity):
    cart = Cart(request)
    book = get_object_or_404(Book, id=bookid)
    cart.update(book=book, quantity=quantity)
    price = (book.price * quantity)

    return render(request, '#', {"price": price})


def cart_remove(request, bookid):
    cart = Cart(request)
    book = get_object_or_404(Book, id=bookid)
    cart.remove(book)
    return redirect('store/favourite_list.html')


def total_cart(request):
    return render(request, '#')


def cart_summary(request):
    return render(request, '#')


def cart_details(request):
    cart = Cart(request)
    context = {
        "cart": cart,
    }
    return render(request, '#', context)