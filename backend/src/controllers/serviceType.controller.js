// ============================================================================
// File: backend/src/controllers/serviceType.controller.js
// Description: Thin HTTP controller for service types catalog
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import serviceTypeService from '../services/serviceType.service.js';

export const getServiceTypes = asyncHandler(async (req, res) => {
  const types = await serviceTypeService.getServiceTypes();
  res.status(200).json({ data: types });
});

export const createServiceType = asyncHandler(async (req, res) => {
  const created = await serviceTypeService.createServiceType(req.body);
  res.status(201).json({ data: created });
});

export const updateServiceType = asyncHandler(async (req, res) => {
  const updated = await serviceTypeService.updateServiceType(req.params.id, req.body);
  res.status(200).json({ data: updated });
});

export default {
  getServiceTypes,
  createServiceType,
  updateServiceType
};
