import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await dashboardService.getDashboard();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await dashboardService.getStats();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
