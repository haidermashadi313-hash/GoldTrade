declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
        _id?: string;
        role?: string;
        username?: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}

export {};
