// ============================================================================
// File: backend/src/controllers/client.controller.js
// Description: Thin HTTP controller for client directory
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import clientService from '../services/client.service.js';

export const getClients = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await clientService.getClients({ page, limit });
  res.status(200).json(result);
});

export const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.body, req.user.id);
  res.status(201).json({ data: client });
});

export const updateClient = asyncHandler(async (req, res) => {
  const updated = await clientService.updateClient(req.params.id, req.body);
  res.status(200).json({ data: updated });
});

export default {
  getClients,
  createClient,
  updateClient
};
