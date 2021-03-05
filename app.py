from flask import Flask, jsonify, request,render_template
# from flask_cors import CORS

import io

import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.transforms.functional as TVF

from PIL import Image

import base64
import re
from io import StringIO

import numpy as np

from model import NN
import model_gan

import cv2

app = Flask(__name__)
# cors = CORS(app)

def data_uri_to_cv2_img(uri):
    """
    Convert a data URL to an OpenCV image
    Credit: https://stackoverflow.com/a/54205640/2415512
    : param uri : data URI representing a BW image
    : returns   : OpenCV image
    """

    encoded_data = uri.split(',')[1]
    nparr = np.fromstring(base64.b64decode(encoded_data), np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

def transform_image(image_str):
    my_transforms = transforms.Compose([
        transforms.Resize((448, 448)),
        transforms.Grayscale(),
        transforms.ToTensor(),
        transforms.Normalize(mean = [0.9823], std = [0.0758]),
    ])
    cv2_image = data_uri_to_cv2_img(image_str)
    image = Image.fromarray(cv2_image)
    # image = Image.open(StringIO(image_bytes))
    return my_transforms(image).unsqueeze(0)


PATH = 'models/model_feature_predictor.ckpt'
model = NN.load_from_checkpoint(PATH)

pretrained_model = model_gan.model_gan
pretrained_model.load_state_dict(torch.load('models/model_sketch_simplification.pth'))

feature_map = {
    1: "Cross, Upper left corner, outside rectangle",
    2: "Large Rectangle",
    3: "Diagonal Cross",
    4: "Horizontal midline of 2",
    5: "Vertical Midline",
    6: "Small rectangle within 2 to the left",
    7: "Small segment above 6",
    8: "Four parallel lines within 2, upper left",
    9: "Triangle above 2, upper right",
    10: "Small vertical line within 2, below 9",
    11: "Circle with three dots within 2",
    12: "Five parallel lines within 2, crossing 3, lower right",
    13: "Side of triangle attached to 2 on right",
    14: "Diamond attached to 13",
    15: "Vertical line within 13, parallel to right vertical of 2",
    16: "Horizontal line within 13, continuing 4 to the right",
    17: "Cross attached to low center",
    18: "Square attached to 2, lower left"
}

def get_prediction(image_str):
    tensor = transform_image(image_str=image_str)
    out = pretrained_model(tensor).detach().squeeze(0)
    pil_out = transforms.ToPILImage()(out)

    return np.array(
        nn.Sigmoid()(model(TVF.to_tensor(pil_out.convert('RGB')).unsqueeze(0)))
        .detach()
        .squeeze(0)
    )

@app.route('/')
def render_page():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if request.method == 'POST':
        imgstring = request.form.get('data')
        # img_bytes = base64.b16decode(re.sub('^data:image/.+;base64,', '', image_b64))

        # img_bytes = file.read()
        predictions = get_prediction(imgstring)
        final_output = {
            index + 1: (feature_map[index + 1], pred.item())
            for index, pred in enumerate(predictions)
        }

    response = jsonify(final_output)
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0')

