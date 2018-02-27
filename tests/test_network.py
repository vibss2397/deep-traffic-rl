from autowebcompat import network
from autowebcompat import utils
from keras import backend as K
import numpy as np


arr1=np.random.rand(1,128)
arr2=np.random.rand(1,128)

def calc_dist(a,b):
    dist=np.sum(np.square(a-b))
    dist_sqroot=np.sqrt(max(dist,K.epsilon()))
    return dist_sqroot.astype(np.float32)

def test_eucledian_distance():
    image0 = K.variable(value=arr1)
    image1 = K.variable(value=arr2)
    dist = network.euclidean_distance([image0,image1])
    evaluate=K.eval(dist)
    assert (evaluate==calc_dist(arr1,arr2))

def test_eucl_distance_output_shape():
    vect=[arr1.shape,arr2.shape]
    shape=network.eucl_dist_output_shape(vect)
    assert(shape==(1,1))


def test_contrastive_loss():
    euclid_dist=calc_dist(arr1,arr2)
    loss=network.contrastive_loss(euclid_dist,1)
    eval=K.eval(loss)
    assert(eval==0)
