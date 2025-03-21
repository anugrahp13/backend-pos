// Import express untuk membuat aplikasi web
const express = require("express");

// Import prisma client untuk berinteraksi dengan database
const prisma = require("../prisma/client");

// Import function untuk menghasilkan invoice acak
const { generateRandomInvoice } = require('../utils/generateRandomInvoice');

// Fungsi untuk membuat transaksi
const createTransaction = async (req, res) => {
    try {
        // Menghasilkan invoice acak
        const invoice = generateRandomInvoice();

        // Memastikan input numerik valid
        const cashierId = parseInt(req.userId);
        const customerId = parseInt(req.body.customer_id) || null;
        const cash = parseInt(req.body.cash);
        const change = parseInt(req.body.change);
        const discount = parseInt(req.body.discount);
        const grandTotal = parseInt(req.body.grand_total);

        // Memeriksa nilai NaN dan mengembalikan error jika ditemukan
        if (isNaN(customerId) || isNaN(cash) || isNaN(change) || isNaN(discount) || isNaN(grandTotal)) {
            return res.status(400).send({
                meta: {
                    success: false,
                    message: "Data input tidak valid. Silakan periksa permintaan Anda.",
                },
            });
        }

        // Menyisipkan data transaksi ke dalam database
        const transaction = await prisma.transaction.create({
            data: {
                cashier_id: cashierId,
                customer_id: customerId,
                invoice: invoice,
                cash: cash,
                change: change,
                discount: discount,
                grand_total: grandTotal,
            },
        });

        // Mengambil item keranjang untuk kasir saat ini
        const carts = await prisma.cart.findMany({
            where: { cashier_id: cashierId },
            include: { product: true },
        });

        // Memproses setiap item keranjang
        for (const cart of carts) {
            // Memastikan harga adalah float
            const price = parseFloat(cart.price);

            // Menyisipkan detail transaksi
            await prisma.transactionDetail.create({
                data: {
                    transaction_id: transaction.id,
                    product_id: cart.product_id,
                    qty: cart.qty,
                    price: price,
                },
            });

            // Menghitung keuntungan
            const totalBuyPrice = cart.product.buy_price * cart.qty;
            const totalSellPrice = cart.product.sell_price * cart.qty;
            const profits = totalSellPrice - totalBuyPrice;

            // Menyisipkan keuntungan
            await prisma.profit.create({
                data: {
                    transaction_id: transaction.id,
                    total: profits,
                },
            });

            // Memperbarui stok produk
            await prisma.product.update({
                where: { id: cart.product_id },
                data: { stock: { decrement: cart.qty } },
            });
        }

        // Menghapus item keranjang untuk kasir
        await prisma.cart.deleteMany({
            where: { cashier_id: cashierId },
        });

        // Mengirimkan response sukses
        res.status(201).send({
            meta: {
                success: true,
                message: "Transaksi berhasil dibuat",
            },
            data: transaction,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan pada server",
            },
            errors: error.message,
        });
    }
};

// Mengekspor fungsi-fungsi untuk digunakan di file lain
module.exports = {
    createTransaction,
};