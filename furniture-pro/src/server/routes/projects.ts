import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requireRole, type AuthedRequest } from '../auth';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

// List projects owned by the authenticated user
projectsRouter.get('/', async (req: AuthedRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { ownerId: req.user!.id },
    include: { parts: true },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(projects);
});

projectsRouter.get('/:id', async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, ownerId: req.user!.id },
    include: { parts: true, versions: true },
  });
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json(project);
});

const projectSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['bed', 'sofa', 'mattress', 'furniture', 'custom']).optional(),
  margin: z.number().optional(),
  currency: z.string().optional(),
});

projectsRouter.post('/', requireRole('admin', 'designer'), async (req: AuthedRequest, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const project = await prisma.project.create({ data: { ...parsed.data, ownerId: req.user!.id } });
  res.status(201).json(project);
});

projectsRouter.put('/:id', requireRole('admin', 'designer'), async (req: AuthedRequest, res) => {
  const owned = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
  if (!owned) return res.status(404).json({ error: 'Not found' });
  const project = await prisma.project.update({ where: { id: req.params.id }, data: req.body });
  res.json(project);
});

projectsRouter.delete('/:id', requireRole('admin', 'designer'), async (req: AuthedRequest, res) => {
  const owned = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
  if (!owned) return res.status(404).json({ error: 'Not found' });
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---- parts ----
projectsRouter.post('/:id/parts', requireRole('admin', 'designer'), async (req: AuthedRequest, res) => {
  const owned = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
  if (!owned) return res.status(404).json({ error: 'Not found' });
  const part = await prisma.part.create({ data: { ...req.body, projectId: req.params.id } });
  res.status(201).json(part);
});

projectsRouter.put('/:id/parts/:partId', requireRole('admin', 'designer'), async (req: AuthedRequest, res) => {
  const part = await prisma.part.update({ where: { id: req.params.partId }, data: req.body });
  res.json(part);
});

projectsRouter.delete('/:id/parts/:partId', requireRole('admin', 'designer'), async (req, res) => {
  await prisma.part.delete({ where: { id: req.params.partId } });
  res.status(204).end();
});
