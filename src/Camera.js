import React from 'react';
import { Camera, Permissions, Audio, MediaLibrary } from 'expo';
import { View, AsyncStorage } from 'react-native';
import Preview from './Preview';
import Capture from './Capture';
import styles from './styles';

// import styles from './styles';

// [[all, one, sounds],[all, two, sounds], [all, three, sounds]...]
// will DRY this out once all vocals are recorded and added
const allSounds = [
  [require('../assets/audio/1.mp3')],
  [require('../assets/audio/2.mp3')],
  [require('../assets/audio/3.mp3')],
  [require('../assets/audio/4.mp3')],
  [require('../assets/audio/5.mp3')],
  [require('../assets/audio/6.mp3')],
  [require('../assets/audio/7.mp3')],
  [require('../assets/audio/8.mp3')],
  [require('../assets/audio/9.mp3')],
  [require('../assets/audio/10.mp3')],
];

const expSounds = [[1], [2], [3], [4], [5], [6], [7], [8], [9], [10]];

export default class CameraComp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      path: null,
      hasCameraPermission: null,
      cameraType: Camera.Constants.Type.front,
      flashMode: Camera.Constants.FlashMode.off,
      zoom: 0,
      values: this.props.screenProps.values,
      compliment: null,
      girl: this.props.screenProps.girl,
      leftHanded: this.props.screenProps.leftHanded,
      flip: false,
      mute: false,
    };
  }
  /* FUNCTIONS */
  setFlashMode = flashMode => this.setState({ flashMode });

  setCameraType = cameraType => this.setState({ cameraType });

  takePicture = async () => {
    try {
      // take pic
      const data = await this.camera.takePictureAsync();
      this.setState({ path: data.uri });
      this.pickCompliment();
    } catch (err) {
      console.log('err: ', err);
    }
  };

  pickCompliment = () => {
    // console.log('all sounds', allSounds);
    const soundBank = allSounds
      .slice(this.state.values[0] - 1, this.state.values[1])
      .flat();
    // console.log('values', this.state.values);
    // console.log('sound bank', soundBank);

    const compliment = soundBank[Math.floor(Math.random() * soundBank.length)];
    this.setState({ compliment: compliment });
    // console.log('++++', compliment);
    this.playCompliment();
  };

  playCompliment = async () => {
    const { sound } = await Audio.Sound.createAsync(this.state.compliment, {
      shouldPlay: true,
      isLooping: false,
      isMuted: this.state.mute,
    });
    this.sound = sound;
  };

  cancelPhoto = () => {
    this.setState({ path: null });
  };

  flipPhoto = () => {
    this.setState({
      flip: this.state.flip === false ? true : false,
    });
  };

  muteAudio = () => {
    this.setState({
      mute: this.state.mute === true ? false : true,
    });
  };

  changeCameraType = () => {
    this.setState({
      cameraType:
        this.state.cameraType === Camera.Constants.Type.back
          ? Camera.Constants.Type.front
          : Camera.Constants.Type.back,
      zoom: this.state.zoom === 0.1 ? 0 : 0,
    });
  };

  changeFlash = () => {
    this.setFlashMode(
      this.state.flashMode === Camera.Constants.FlashMode.on
        ? Camera.Constants.FlashMode.off
        : Camera.Constants.FlashMode.on
    );
  };

  changeZoom = () => {
    this.setState({
      zoom: this.state.zoom === 0 ? 0.1 : 0,
    });
  };

  setRef = ref => {
    this.camera = ref;
  };

  savePhoto = async () => {
    //save to camera roll and copy to 'YLG' album
    let photo = await MediaLibrary.createAssetAsync(this.state.path);
    const album = await MediaLibrary.getAlbumAsync('You Look Great');
    if (album === null) {
      await MediaLibrary.createAlbumAsync('You Look Great', photo, false);
    } else {
      MediaLibrary.addAssetsToAlbumAsync([photo], album, true);
    }
    // to save the compliment with the photo
    let photoFilename = this.removePath(this.state.path);
    this.saveCompliment(photoFilename);
    // wipe the slate clean after all saving is done
    this.props.screenProps.refreshGallery();
    this.cancelPhoto();
  };

  saveCompliment = async filename => {
    try {
      await AsyncStorage.setItem(filename, this.state.compliment.toString());
    } catch (error) {
      console.log(error.message);
    }
  };

  // function to trim path off of string to keep only filename
  removePath = str => {
    return str
      .split('\\')
      .pop()
      .split('/')
      .pop();
  };

  /* LIFECYCLE */
  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermission: status === 'granted',
    });
  }

  // when user changes options, this will update the state
  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      nextProps.screenProps.values !== prevState.values ||
      nextProps.screenProps.leftHanded !== prevState.leftHanded ||
      nextProps.screenProps.girl !== prevState.girl
    ) {
      // console.log('camera state is firing');
      return {
        values: nextProps.screenProps.values,
        leftHanded: nextProps.screenProps.leftHanded,
        girl: nextProps.screenProps.girl,
      };
    } else {
      return null; // Triggers no change in the state
    }
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.path ? (
          <Preview
            cameraProps={{
              uri: this.state.path,
              playCompliment: this.playCompliment,
              flip: this.state.flip,
              cancelPhoto: this.cancelPhoto,
              flipPhoto: this.flipPhoto,
              savePhoto: this.savePhoto,
            }}
          />
        ) : (
          <Capture
            cameraProps={{
              navigation: this.props.navigation,
              hasCameraPermission: this.state.hasCameraPermission,
              flashMode: this.state.flashMode,
              leftHanded: this.state.leftHanded,
              girl: this.state.girl,
              mute: this.state.mute,
              zoom: this.state.zoom,
              cameraType: this.state.cameraType,
              takePicture: this.takePicture,
              muteAudio: this.muteAudio,
              changeCameraType: this.changeCameraType,
              changeFlash: this.changeFlash,
              changeZoom: this.changeZoom,
              setRef: this.setRef,
            }}
          />
        )}
      </View>
    );
  }
}
