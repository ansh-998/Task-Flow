// ============================================================================
// File: backend/src/controllers/taskTemplate.controller.js
// Description: Thin HTTP controller for task templates
// ============================================================================

import asyncHandler from '../utils/asyncHandler.js';
import taskTemplateService from '../services/taskTemplate.service.js';

export const getTemplatesByService = asyncHandler(async (req, res) => {
  const templates = await taskTemplateService.getTemplates(req.params.id);
  res.status(200).json({ data: templates });
});

export const createTemplate = asyncHandler(async (req, res) => {
  const created = await taskTemplateService.createTemplate(req.params.id, req.body);
  res.status(201).json({ data: created });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const updated = await taskTemplateService.updateTemplate(req.params.id, req.body);
  res.status(200).json({ data: updated });
});

export default {
  getTemplatesByService,
  createTemplate,
  updateTemplate
};
