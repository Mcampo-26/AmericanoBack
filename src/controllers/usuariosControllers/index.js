import Usuario from '../../Models/Usuario/index.js';
import Roles from '../../Models/Roles/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

// 🔐 CREAR usuario
export const createUsuario = async (req, res) => {
    try {
      const { nombre, email, password, telefono, role } = req.body;
  
      // Verifica si el usuario ya existe
      const usuarioExistente = await Usuario.findOne({ email });
      if (usuarioExistente) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
  
      // Hashea la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  
      // Crea el nuevo usuario
      const nuevoUsuario = new Usuario({
        nombre,
        email,
        telefono,
        password: hashedPassword,
        role: role || null,
        verificationCode,
        isVerified: false,
        lastVerificationCodeSentAt: new Date(),
      });
  
      // Guarda en la base de datos
      await nuevoUsuario.save();
  
      // Responde al frontend
      res.status(201).json({ message: "Usuario creado correctamente", usuario: nuevoUsuario });
  
    } catch (error) {
      console.error("Error al crear usuario:", error);
      res.status(500).json({ message: "Error del servidor al crear el usuario" });
    }
  };


export const getUsuarios = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const usuarios = await Usuario.find()
        .populate('role', 'name')
        .skip((page - 1) * limit)
        .limit(Number(limit));
  
      const total = await Usuario.countDocuments();
  
      res.status(200).json({
        usuarios,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
      });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  };


  // 🔄 ACTUALIZAR usuario
export const updateUsuario = async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, email, telefono, role, estado } = req.body;
  
      const usuarioActualizado = await Usuario.findByIdAndUpdate(
        id,
        { nombre, email, telefono, role, estado },
        { new: true }
      );
  
      if (!usuarioActualizado) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      res.json({ message: 'Usuario actualizado correctamente', usuario: usuarioActualizado });
  
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar usuario' });
    }
  };

  
  // ❌ ELIMINAR usuario
export const deleteUsuario = async (req, res) => {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findByIdAndDelete(id);
  
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      res.json({ message: 'Usuario eliminado correctamente' });
  
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
  };

  
  // 🔑 VERIFICAR usuario con código
export const verifyUsuario = async (req, res) => {
    try {
      const { email, code } = req.body;
  
      const usuario = await Usuario.findOne({ email, verificationCode: code });
      if (!usuario) {
        return res.status(400).json({ message: 'Código inválido' });
      }
  
      usuario.isVerified = true;
      usuario.verificationCode = undefined;
      await usuario.save();
  
      res.json({ message: 'Usuario verificado con éxito' });
    } catch (error) {
      res.status(500).json({ message: 'Error al verificar usuario' });
    }
  };

  
  // 🔐 LOGIN de usuario
export const loginUsuario = async (req, res) => {
    try {
      const { email, password } = req.body;
      const usuario = await Usuario.findOne({ email }).populate('role');
  
      if (!usuario) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
  
      const isMatch = await bcrypt.compare(password, usuario.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
  
      const token = jwt.sign({
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role?.name || null,
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token, usuario });
  
    } catch (error) {
      res.status(500).json({ message: 'Error durante el login' });
    }
  };
  