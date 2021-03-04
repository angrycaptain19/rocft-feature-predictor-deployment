
import torch
import torch.nn as nn
import torchvision.models as models

import pytorch_lightning as pl


class NN(pl.LightningModule):
    def __init__(self, hparams, data_path=''):
        super().__init__()
        self.hparams = hparams
        self.data_path = data_path
        self.model = models.resnet18(pretrained=False)
        self.model.fc = nn.Linear(512, 18)
        self.criterion = nn.BCEWithLogitsLoss()
        self.best_validation_loss = 1e6

    def forward(self, x):
        x = self.model(x)
        return x
