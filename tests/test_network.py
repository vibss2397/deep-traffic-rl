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
    loss1=network.contrastive_loss(1,euclid_dist) #if we assume 1 was the output
    loss2=network.contrastive_loss(0,euclid_dist) #if we assume 0 was the output
    eval1=K.eval(loss1)
    eval2=K.eval(loss2)
    assert(eval1>=0)
    assert(eval2>=0)

# def test_