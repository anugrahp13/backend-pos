// Mengimpor express
const express = require("express");

// Mengimpor prisma client
const prisma = require("../prisma/client");

// Fungsi findCustomers dengan pagination
const findCustomers = async (req, res) => {
  try {
    // Mendapatkan nilai page dan limit dari parameter query, dengan nilai default
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Ambil kata kunci pencarian dari parameter query
    const search = req.query.search || "";

    // Mendapatkan data pelanggan yang dipaginasikan dari database
    const customers = await prisma.customer.findMany({
      where: {
        name: {
          contains: search, // Mencari nama pelanggan yang mengandung kata kunci
        },
      },
      select: {
        id: true,
        name: true,
        no_telp: true,
        address: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        id: "desc",
      },
      skip: skip,
      take: limit,
    });

    // Mendapatkan total jumlah pelanggan untuk pagination
    const totalCustomers = await prisma.customer.count({
      where: {
        name: {
          contains: search, // Menghitung total pelanggan yang sesuai dengan kata kunci pencarian
        },
      },
    });

    // Menghitung total halaman
    const totalPages = Math.ceil(totalCustomers / limit);

    // Mengirimkan respons
    res.status(200).send({
      // Meta untuk respons JSON
      meta: {
        success: true,
        message: "Berhasil mendapatkan semua pelanggan",
      },
      // Data pelanggan
      data: customers,
      // Data pagination
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        perPage: limit,
        total: totalCustomers,
      },
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirimkan respons dengan pesan error
    res.status(500).send({
      // Meta untuk respons JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // Data error
      errors: error,
    });
  }
};

// Fungsi createCustomer untuk membuat pelanggan baru
const createCustomer = async (req, res) => {
  try {
    // Menyisipkan data pelanggan baru ke dalam database
    const customer = await prisma.customer.create({
      data: {
        name: req.body.name,
        no_telp: req.body.no_telp,
        address: req.body.address,
      },
    });

    // Mengirimkan respons setelah berhasil membuat pelanggan baru
    res.status(201).send({
      // Meta untuk respons JSON
      meta: {
        success: true,
        message: "Pelanggan berhasil dibuat",
      },
      // Data pelanggan yang baru dibuat
      data: customer,
    });
  } catch (error) {
    // Jika terjadi kesalahan, kirimkan respons dengan pesan error
    res.status(500).send({
      // Meta untuk respons JSON
      meta: {
        success: false,
        message: "Terjadi kesalahan di server",
      },
      // Data error
      errors: error,
    });
  }
};

// Mengekspor fungsi-fungsi untuk digunakan di modul lain
module.exports = { findCustomers, createCustomer };
