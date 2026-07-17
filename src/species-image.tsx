import type {ImgHTMLAttributes,SyntheticEvent} from 'react';
import {speciesFallbackImage,speciesLockedImage,type Species} from './data';

type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'> & {item:Species;locked?:boolean};

export function setSpeciesImageFallback(event:SyntheticEvent<HTMLImageElement>,item:Species){
 const fallback=speciesFallbackImage(item);
 if(event.currentTarget.getAttribute('src')===fallback)return;
 event.currentTarget.src=fallback;
 event.currentTarget.dataset.fallback='true';
}

export function SpeciesImage({item,onError,alt,locked=false,...props}:Props){
 const src=locked?speciesLockedImage(item):item.image;
 return <img {...props} src={src} alt={alt??item.name} onError={event=>{setSpeciesImageFallback(event,item);onError?.(event)}}/>;
}
