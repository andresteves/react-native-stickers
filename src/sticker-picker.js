import React, {Component} from 'react';
import ViewShot from 'react-native-view-shot';

//Native
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import {
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  State,
} from 'react-native-gesture-handler';

const ghost      = require('./emojis/ghost.png');
const heart      = require('./emojis/heart.png');
const heartEyes  = require('./emojis/heartEyes.png');
const kiss       = require('./emojis/kiss.png');
const party      = require('./emojis/party.png');
const robot      = require('./emojis/robot.png');
const smile      = require('./emojis/smile.png');
const sunglasses = require('./emojis/sunglasses.png');
const thumbsup   = require('./emojis/thumbsup.png');

const USE_NATIVE_DRIVER = false; // https://github.com/kmagiera/react-native-gesture-handler/issues/71
const MINIMUM_STICKER_SCALE = 0.5;
const MAXIMUM_STICKER_SCALE = 3;

type Props = {};
export default class StickerPicker extends Component<Props> {
  constructor(props) {
    super(props);

    this.state = {
      pan: new Animated.ValueXY(),
      showSticker: false,
    };

    /* Pinching */
    this.baseScale = new Animated.Value(1);
    this.pinchScale = new Animated.Value(1);
    this.scale = this.pinchScale.interpolate({
      inputRange: [MINIMUM_STICKER_SCALE, MAXIMUM_STICKER_SCALE],
      outputRange: [MINIMUM_STICKER_SCALE, MAXIMUM_STICKER_SCALE],
      extrapolate: 'clamp',
    });
    this.lastScale = 1;

    this.onPinchGestureEvent = Animated.event(
      [{nativeEvent: {scale: this.pinchScale}}],
      {useNativeDriver: USE_NATIVE_DRIVER},
    );

    /* Rotation */
    this.rotate = new Animated.Value(0);
    this.rotateStr = this.rotate.interpolate({
      inputRange: [-100, 100],
      outputRange: ['-100rad', '100rad'],
    });
    this.lastRotate = 0;
    this.onRotateGestureEvent = Animated.event(
      [{nativeEvent: {rotation: this.rotate}}],
      {useNativeDriver: USE_NATIVE_DRIVER},
    );

    /* Pan */
    this.translateX = new Animated.Value(0);
    this.translateY = new Animated.Value(0);
    this.lastOffset = {x: 0, y: 0};
    this.onPanGestureEvent = Animated.event(
      [
        {
          nativeEvent: {
            translationX: this.translateX,
            translationY: this.translateY,
          },
        },
      ],
      {useNativeDriver: USE_NATIVE_DRIVER},
    );
  }

  _onRotateHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this.lastRotate += event.nativeEvent.rotation;
      this.rotate.setOffset(this.lastRotate);
      this.rotate.setValue(0);
    }
  }

  _onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      this.lastScale *= event.nativeEvent.scale;
      this.baseScale.setValue(this.lastScale);
      // this.pinchScale.setValue(1);
    }
  }

  _onPanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setLastOffset({
        x: lastOffset + event.nativeEvent.translationX,
        y: lastOffset + event.nativeEvent.translationY,
      });
      translateX.setOffset(lastOffset.x);
      setTranslateX(new Animated(0));
      translateY.setOffset(lastOffset.y);
      setTranslateY(new Animated(0));
    }
  }

  componentDidMount() {
    this._isMounted = true;

    if(this._isMounted) {
      this.currentPanValue = {x: 0, y: 0};
      this.panListener = this.state.pan.addListener((value) => this.currentPanValue = value);
    }
  }

  componentWillUnmount() {
    if(this._isMounted) {
      this.state.pan.removeListener(this.panListener);
    }

    this._isMounted = false;
  }

  takeViewShot() {
    if(this._isMounted) {
      this.viewShot.capture().then(uri => {
        Image.getSize(uri, (width, height) => {
          this.props.completedEditing(uri, width, height);
          this.setState({
            finalImage: {
              uri: uri,
              width: width,
              height: height
            }
            })
        });
      });
    }
  }

  resetViewShot() {
    if(this._isMounted) {
      this.setState({
        finalImage: null,
        pan: new Animated.ValueXY(),
        showSticker: false,
      })
    }
  }

  previewStickerImage(imageUrl, size = 15) {
    if(this._isMounted) {
      return(
        <Image
          style={{width: this.props.previewImageSize, height: this.props.previewImageSize, margin: 5}}
          source={imageUrl}
        />
      )
    }
  }

  generateRandomId() {
    return Math.floor(Math.random() * 100) + 1;
  }

  render() {
    const {
      bottomContainer,
      bottomContainerStyle,
      imageSource,
      includeDefaultStickers,
      stickers,
      style,
      topContainer,
      visible
    } = this.props;
    const { finalImage, showSticker, sticker } = this.state;
    const finalImageUrl = finalImage ? finalImage.uri : null;

    const defaultStickers = [
      [ this.previewStickerImage(ghost), ghost ],
      [ this.previewStickerImage(heart), heart ],
      [ this.previewStickerImage(heartEyes), heartEyes ],
      [ this.previewStickerImage(kiss), kiss ],
      [ this.previewStickerImage(party), party ],
      [ this.previewStickerImage(robot), robot ],
      [ this.previewStickerImage(smile), smile ],
      [ this.previewStickerImage(sunglasses), sunglasses ],
      [ this.previewStickerImage(thumbsup), thumbsup ]
    ];

    let finalStickers;
    if(!stickers) {
      finalStickers = defaultStickers;
    } else if(includeDefaultStickers) {
      finalStickers = stickers.concat(defaultStickers);
    } else {
      finalStickers = stickers;
    }

    if(!this._isMounted) {
      return <View />
    }

    return (
      <Modal visible={visible}>
      <View>
        { topContainer }
      </View>
        <View>
        { !finalImage && (
          <View>
            <ViewShot
              style={{ flex: null}}
              ref={ref => {
                this.viewShot = ref;
              }}
              options={{ format: 'jpg', quality: 1.0 }}
            >
              <ImageBackground
                ref={image => (this.imageComponent = image)}
                source={{ uri: imageSource }}
                style={[styles.attachment, this.props.imageStyle]}
              >
              { showSticker && this._isMounted &&  (
                <PanGestureHandler
                  key={'view' + this.generateRandomId()}
                  {...this.props}
                  onGestureEvent={this.onPanGestureEvent}
                  onHandlerStateChange={this.onPanStateChange}
                  id={'image_drag' + this.generateRandomId()}
                  shouldCancelWhenOutside={true}>
                  <RotationGestureHandler
                    id={'image_rotation' + this.generateRandomId()}
                    onGestureEvent={this.onRotateGestureEvent}
                    onHandlerStateChange={this.onRotateHandlerStateChange}>
                    <PinchGestureHandler
                      id={'image_pinch' + this.generateRandomId()}
                      onGestureEvent={this.onPinchGestureEvent}
                      onHandlerStateChange={this.onPinchHandlerStateChange}>
                      <Animated.View
                        style={[localStyles.stickerContainer, this.state.pan.getLayout(), {transform: [{translateX: this.translateX}, {translateY: this.translateY}],}]}
                      >
                      <Image
                        style={{width: this.props.stickerSize, height: this.props.stickerSize, transform: [
                            {perspective: 200},
                            {scale: this.scale},
                            {rotate: this.rotateStr},
                          ],}}
                        source={sticker}
                      />
                      </Animated.View>
                    </PinchGestureHandler>
                  </RotationGestureHandler>
                </PanGestureHandler>
              )}
              </ImageBackground>
            </ViewShot>
            <Text style={styles.title}>Select a sticker</Text>
            <ScrollView overScrollMode={'always'} horizontal={true} contentContainerStyle={[styles.stickerPickerContainer, this.props.bottomContainerStyle]}>
                {finalStickers.map((sticker, index)  => {
                  return(
                    <TouchableOpacity key={index} onPress={() => this._isMounted && this.setState({showSticker: true, sticker: sticker[1]})}>
                      {sticker[0]}
                    </TouchableOpacity>
                  )
                })}
            </ScrollView>
            <TouchableOpacity style={this.props.bottomContainerStyle} onPress={() => this.takeViewShot()}>
              {bottomContainer}
            </TouchableOpacity>
          </View>
          )}
        </View>
      </Modal>
    );
  }
}

const imageSize = 500;
const stickerCanvasSize = imageSize * 2;
const localStyles = StyleSheet.create({
  stickerContainer: {
    position: 'absolute',
    height: stickerCanvasSize * 3,
    width: stickerCanvasSize,
    alignItems: 'center',
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  stickerScreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    resizeMode: 'contain',
    width: 300,
    height: 300,
    zIndex: 9,
  },
});

let { height, width } = Dimensions.get('window');
const styles = StyleSheet.create({
  stickerPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  actionTitle: {
    color:'blue',
    alignSelf: 'center',
    marginTop: 20,
    fontSize: 20
  },
  attachment: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    height: 500,
    width: width,
  },
  finalAttachment: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    height: 500,
    width: width,
  },
  text: {
    fontSize: 15,
    alignSelf: 'center',
    marginLeft: 5,
    marginRight: 5,
    textAlign: 'center',
    color: '#fff',
  },
  title: {
    width: width,
    marginVertical: 5,
    fontSize: 20,
    textAlign: 'center'
  },
});
