import { create } from 'zustand';
import { Broker } from '../types';
import * as BrokerDB from '../db/brokers';

interface BrokerState {
  brokers: Broker[];
  loadBrokers: () => void;
  addBroker: (name: string, feeRate: number) => void;
  editBroker: (id: number, name: string, feeRate: number) => void;
  removeBroker: (id: number) => void;
}

export const useBrokerStore = create<BrokerState>((set) => ({
  brokers: [],

  loadBrokers: () => {
    const brokers = BrokerDB.getAllBrokers();
    set({ brokers });
  },

  addBroker: (name, feeRate) => {
    BrokerDB.createBroker(name, feeRate);
    const brokers = BrokerDB.getAllBrokers();
    set({ brokers });
  },

  editBroker: (id, name, feeRate) => {
    BrokerDB.updateBroker(id, name, feeRate);
    const brokers = BrokerDB.getAllBrokers();
    set({ brokers });
  },

  removeBroker: (id) => {
    BrokerDB.deleteBroker(id);
    set((s) => ({ brokers: s.brokers.filter((b) => b.id !== id) }));
  },
}));
